/*
 * Copyright (C) 2019-2022 HERE Europe B.V.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * SPDX-License-Identifier: Apache-2.0
 * License-Filename: LICENSE
 */

import BasicDisplay from '../BasicDisplay';
import {GLRender, RenderOptions} from './GLRender';
import GLBucket from './Bucket';

import {createBuffer} from './buffer/createBuffer';
import {createImageBuffer} from './buffer/createImageBuffer';

import {transformMat4} from 'gl-matrix/vec3';
import {Layer, Layers, ScreenTile} from '../Layers';
import GLTile from './GLTile';
import {FeatureFactory} from './buffer/FeatureFactory';
import {CollisionHandler} from './CollisionHandler';
import {GeometryBuffer} from './buffer/GeometryBuffer';
import {CustomLayer, tile, TileLayer, Layer as BasicLayer} from '@here/xyz-maps-core';
import {PASS} from './program/GLStates';
import {Raycaster} from './Raycaster';

const PREVIEW_LOOK_AHEAD_LEVELS: [number, number] = [3, 9];

// const fromClipSpace = (clip, width, height) => [
//     (clip[0] + 1) / 2.0 * width,
//     (1 - clip[1]) / 2.0 * height // oriented top->down
// ];
// const toClipSpace = (x, y, z, width, height) => [
//     2 * x / width - 1,
//     -2 * y / height + 1,
//     z || 0
// ];

const stencilQuad = (quadkey: string, subQuadkey: string) => {
    let level = quadkey.length;
    let dLevel = subQuadkey.length - level;
    // quad:
    // -------------
    // |  0  |  1  |
    // -------------
    // |  2  |  3  |
    // -------------
    let x = 0;
    let y = 0;

    for (let i = 0, size = .5; i < dLevel; i++, size *= .5) {
        const quad = Number(subQuadkey.charAt(level + i));
        x += (quad % 2) * size;
        y += Number(quad > 1) * size;
    }
    return [x, y];
};


export type TileBufferData = {
    z: number;
    tiled: true;
    b: GeometryBuffer;
    data: {
        tile: ScreenTile;
        preview?: [string, number, number, number, number, number, number, number, number];
        stencils?;
    };
};

type CustomBufferData = {
    z: number;
    tiled: boolean;
    b: {
        zLayer?: number;
        zIndex?: number;
        pass?: number;
        flat: boolean;
    };
    data: CustomLayer;
};

type BufferData = CustomBufferData | TileBufferData;

class WebGlDisplay extends BasicDisplay {
    static zoomBehavior: 'fixed' | 'float' = 'float';

    private name: string = 'gl-test';

    render: GLRender;
    buckets: GLBucket;
    private readonly factory: FeatureFactory;
    private readonly collision: CollisionHandler;
    private rayCaster: Raycaster;
    private groundResolution: number;
    private worldCenter: number[] = [0, 0];
    private worldSize: number;

    constructor(mapEl: HTMLElement, renderTileSize: number, devicePixelRatio: number | string, renderOptions?: RenderOptions) {
        super(
            mapEl,
            renderTileSize,
            // auto dpr is default for gl display
            !devicePixelRatio ? 'auto' : devicePixelRatio,
            new GLBucket(512),
            new GLRender(renderOptions),
            PREVIEW_LOOK_AHEAD_LEVELS
        );

        if (this.dpr < 2) {
            this.buckets.setSize(1024);
        }

        const display = this;
        this.collision = new CollisionHandler(display);

        this.buckets.onDrop = function(buffers, index) {
            const {quadkey, layers} = this;

            display.collision.clearTile(quadkey, layers[index]);

            display.releaseBuffers(buffers);
        };

        const {render} = display;
        render.init(this.canvas, this.dpr);

        this.rayCaster = new Raycaster(render.screenMat, render.invScreenMat);

        this.factory = new FeatureFactory(render.gl, this.collision, this.dpr);
    }

    private refreshTile(quadkey: string, layerId: string) {
        const dLayer = this.layers.get(layerId);
        if (dLayer) {
            const dTile = this.buckets.get(quadkey, true /* SKIP TRACK */);
            if (dTile) {
                const layer = <TileLayer>dLayer.layer;
                const {index} = dLayer;
                dTile.preview(index, false);
                dTile.ready(index, false);
                dTile.cancelTasks(layer);
                const tile = layer.getCachedTile(dTile.quadkey);
                if (tile) {
                    // tile processing is only necessary if it is still visible on screen.
                    if (this.getScreenTile(quadkey, dLayer.tileSize)) {
                        this.handleTile(tile, layer, dTile, index);
                    }
                }
            }
        }
    }

    private releaseBuffers(buffers: GeometryBuffer[]) {
        const renderer = this.render;

        if (buffers) {
            for (let buf of buffers) {
                renderer.deleteBuffer(buf);
            }
        }
    }

    removeLayer(layer: TileLayer): number {
        this.collision.removeTiles(this.layers.get(layer));
        return super.removeLayer(layer);
    }

    unproject(x: number, y: number, z?): number[] {
        const invScreenMat = this.render.invScreenMat;

        if (typeof z == 'number') {
            const p = [x, y, z];
            transformMat4(p, p, invScreenMat);
            p[2] *= -1;
            return p;
        }

        // find line intersection with plane where z is 0
        // const targetZ = 0.0;
        const targetZ = 0;
        const p0 = [x, y, 0];
        const p1 = [x, y, 1];

        transformMat4(p0, p0, invScreenMat);
        transformMat4(p1, p1, invScreenMat);

        const z0 = p0[2];
        const z1 = p1[2];
        const t = z0 === z1 ? 0 : (targetZ - z0) / (z1 - z0);

        // linear interpolation
        return [p0[0] * (1 - t) + p1[0] * t, p0[1] * (1 - t) + p1[1] * t];
    }

    // from unprojected screen pixels to projected screen pixels
    project(x: number, y: number, z: number = 0, sx = this.sx, sy = this.sy): [number, number, number] {
        // x -= screenOffsetX;
        // y -= screenOffsetY;
        // const p = [x, y, 0];
        // const s = this.s;
        // const p = [x * s, y * s, 0];
        const p = [x - sx, y - sy, -z];
        return transformMat4(p, p, this.render.screenMat);
        // transformMat4(p, p, this.render.vPMats);
        // return fromClipSpace(p, this.w, this.h);
    }

    setSize(w: number, h: number) {
        super.setSize(w, h);

        this.initRenderer();
    }

    setTransform(scale: number, rotZ: number, rotX: number) {
        // if (this.s != scale || this.rz != rotZ || this.rx != rotX)
        // {
        const PI2 = 2 * Math.PI;
        rotZ = (rotZ + PI2) % PI2;
        this.s = scale;
        this.rz = rotZ;
        this.rx = rotX;
        // }
    }

    setView(
        worldCenter: [number, number],
        scale: number,
        rotZ: number,
        rotX: number,
        groundResolution: number = this.groundResolution,
        worldSize: number = this.worldSize
    ) {
        super.setView(worldCenter, scale, rotZ, rotX, groundResolution, worldSize);

        this.groundResolution = groundResolution;
        this.worldCenter[0] = worldCenter[0];
        this.worldCenter[1] = worldCenter[1];
        this.worldSize = worldSize;

        this.initRenderer();
    }

    private initRenderer() {
        if (this.render.gl) {
            this.render.initView(
                this.w,
                this.h,
                this.s,
                this.rx,
                this.rz,
                this.groundResolution,
                this.worldCenter[0],
                this.worldCenter[1],
                this.worldSize
            );
        }
    }

    prepareTile(tile, data, layer: TileLayer, dTile: GLTile, onDone: (dTile: GLTile, layer: TileLayer) => void) {
        const display = this;
        const renderer = display.render;
        const gl = renderer.gl;
        const tileSize = layer.tileSize;
        const {quadkey} = dTile;
        const layerId = layer.id;
        const displayLayer = this.layers.get(layerId);

        if (tile.type == 'image' && data instanceof Image) {
            const buffer = createImageBuffer(data, gl, tileSize, displayLayer.index > 0);
            // make sure image tiles are considered by global zIndex
            displayLayer.addZ(buffer.zIndex);
            dTile.preview(dTile.setData(layer, [buffer]), null);
            onDone(dTile, layer);
        } else if (data.length) {
            const task = createBuffer(
                data,
                displayLayer,
                tileSize,
                tile,
                this.factory,
                // on initTile / start
                () => {
                    display.collision.initTile(tile, displayLayer);
                },
                // on done
                (buffer, pendingResources) => {
                    dTile.removeTask(task, layer);
                    dTile.preview(dTile.setData(layer, buffer), null);

                    if (pendingResources.length) {
                        // Promise.all(pendingResources).then(()=>this.refreshTile(quadkey, layerId));
                        pendingResources.forEach((resource) => {
                            resource.then(() => this.refreshTile(quadkey, layerId));
                        });
                    }

                    const collisionsUpdated = display.collision.completeTile(true);
                    if (collisionsUpdated) {
                        // trigger phase2 collision detection (fullscreen viewport)
                        this.dirty = true;
                    }

                    // clear previews of related parent/child tiles...
                    let overlayingTiles = dTile.getOverlayingTiles();
                    for (let overlayingTile of overlayingTiles) {
                        overlayingTile.preview(displayLayer.index, null);
                    }

                    onDone(dTile, layer);
                }
            );
            dTile.addTask(task, layer);
        } else {
            dTile.preview(dTile.setData(layer, []), null);
            onDone(dTile, layer);
        }
    }

    private orderBuffers(
        zSorted: BufferData[],
        buffers: (GeometryBuffer | CustomBufferData['b'])[],
        layer: Layer,
        absZOrder: {
            [intZ: string]: number
        },
        data: CustomBufferData['data'] | TileBufferData['data'],
        tiled: boolean
    ) {
        for (let buffer of buffers) {
            let {zLayer, zIndex} = buffer;

            if (zLayer == null) {
                zLayer = layer.index + 1;
            }

            let z = zLayer * 1e8 + zIndex * 10;

            if (!buffer.flat) {
                // make sure 3d geom is always drawn "after" 2d geom. even if same zIndex is used.
                // otherwise stencil conflicts are possible.
                z += 1;
            }
            absZOrder[z] = 0;

            zSorted[zSorted.length] = {
                b: buffer,
                z,
                data,
                tiled
            } as TileBufferData;
        }
    }

    private initLayerBuffers(layers: Layers) {
        const {buckets} = this;
        let tileBuffers: BufferData[] = [];
        let previewTiles: {
            [qk: string]: number[][]
        };
        let absZOrder = {};

        for (let layer of layers) {
            let tiles = layer.tiles;
            // reset tile ready count
            layer.cnt = 0;

            previewTiles = {};

            if (!layer.layer.tiled) {
                layer.ready = true;
                const customLayer = <CustomLayer>layer.layer;
                const {renderOptions} = customLayer;
                this.orderBuffers(tileBuffers,
                    [{
                        zLayer: renderOptions.zLayer,
                        zIndex: renderOptions.zIndex,
                        pass: renderOptions.alpha || 1,
                        flat: customLayer.flat
                    }],
                    layer,
                    absZOrder,
                    <CustomLayer>layer.layer,
                    false
                );
                continue;
            }


            if (tiles) {
                let layerIndex = layer.index;
                let length = tiles.length;

                for (let screenTile of tiles) {
                    let dTile = <GLTile>screenTile.tile;
                    let buffers = dTile.data?.[layer.index];

                    if (!layer.ready && dTile.ready(layerIndex) && ++layer.cnt == length) {
                        layer.ready = true;
                    }

                    if (!buffers) {
                        let previewData;
                        if ((previewData = dTile.preview(layerIndex))) {
                            if (previewData.length) {
                                for (let preview of previewData) {
                                    const [previewQuadkey] = preview;

                                    const tileStencil = stencilQuad(previewQuadkey, dTile.quadkey);

                                    if (previewTiles[previewQuadkey]) {
                                        previewTiles[previewQuadkey].push(tileStencil);
                                        continue;
                                    }

                                    previewTiles[previewQuadkey] = [tileStencil];

                                    let previewTile = <GLTile>buckets.get(previewQuadkey, true /* SKIP TRACK */);
                                    let previewBuffers;
                                    previewBuffers = previewTile?.getData(layerIndex);
                                    if (previewBuffers?.length) {
                                        this.orderBuffers(
                                            tileBuffers,
                                            previewBuffers,
                                            layer,
                                            absZOrder,
                                            {
                                                tile: screenTile,
                                                preview,
                                                stencils: previewTiles[previewQuadkey]
                                            },
                                            true
                                        );
                                    }
                                }
                            }
                        }
                    } else if (buffers.length) {
                        this.orderBuffers(tileBuffers, buffers, layer, absZOrder, {tile: screenTile}, true);
                    }
                }
            }
        }

        let maxZIndex = 0;
        for (let z of Object.keys(absZOrder).sort((a, b) => Number(a) - Number(b))) {
            absZOrder[z] = maxZIndex++;
        }

        let min3dZIndex = Infinity;

        for (let i = 0, z, zTile; i < tileBuffers.length; i++) {
            zTile = tileBuffers[i];
            z = zTile.z = absZOrder[zTile.z];

            if (!zTile.b.flat && z < min3dZIndex) {
                // if (!zTile.b.flat && z < min3dZIndex && !zTile.b.isPointBuffer() ) {
                min3dZIndex = z;
            }
        }

        return {tileBuffers, min3dZIndex, maxZIndex};
    }

    protected getCamGroundPositionScreen() {
        const {cameraWorld} = this.render;
        return this.project(cameraWorld[0], cameraWorld[1]);
    }

    protected viewport(dirty?: boolean) {
        const display = this;
        const {buckets, layers, render} = display;
        const layerLength = layers.length;
        let length;

        if (display.dirty) {
            display.dirty = false;
            display.collision.update(
                display.grid.tiles[512],
                // make sure display will refresh in case of cd toggles visibility
                () => display.update()
            );
        }

        render.clear(display.bgColor);

        render.fixedView = Number(!this.viewChange);

        let {tileBuffers, min3dZIndex, maxZIndex} = this.initLayerBuffers(layers);

        render.zIndexLength = maxZIndex;

        // fill the depthbuffer with real depth values for the ground plane.
        // render.initGroundDepth(this.grid.minX, this.grid.minY, Math.max(this.grid.maxX - this.grid.minX, this.grid.maxY - this.grid.minY));

        render.setPass(PASS.OPAQUE);

        let b = tileBuffers.length;
        while (b--) {
            let data = tileBuffers[b];
            if (data?.tiled) {
                // render.initBufferScissorBox((<TileBufferData>data).b, (<TileBufferData>data).data.tile, (<TileBufferData>data).data.preview);
                render.draw(<TileBufferData>data, min3dZIndex);
            }
        }

        render.setPass(PASS.ALPHA);

        // sort by zIndex and alpha/post alpha.
        tileBuffers = tileBuffers.sort((buf1, buf2) => 10 * (buf1.z - buf2.z) + buf1.b.pass - buf2.b.pass);
        let layerZIndex = 0;

        do {
            let secondAlphaPass = false;

            for (b = 0, length = tileBuffers.length; b < length; b++) {
                let data = tileBuffers[b];
                let buffer = data.b;

                if (buffer.pass & PASS.POST_ALPHA) {
                    // do depth in this pass only and "main" drawing in an additional pass
                    secondAlphaPass = true;
                }
                if (data?.z == layerZIndex) {
                    if (!data.tiled) {
                        render.drawCustom((<CustomBufferData>data).data, data.z);
                    } else {
                        render.draw(<TileBufferData>data, min3dZIndex);
                    }
                }
            }

            if (render.pass == PASS.POST_ALPHA) {
                render.setPass(PASS.ALPHA);
            } else if (secondAlphaPass) {
                render.setPass(PASS.POST_ALPHA);
                // draw again... first alpha pass was used to stencil.
                layerZIndex--;
            }
        } while (++layerZIndex < maxZIndex);

        if (render.tileGrid) {
            for (let tileSize in display.tiles) {
                const tiles = display.tiles[tileSize];
                if (tiles.length) {
                    for (let screenTile of tiles) {
                        render.drawGrid(screenTile.x, screenTile.y, <GLTile>screenTile.tile, Number(tileSize));
                    }
                    break;
                }
            }
        }
    }

    destroy() {
        super.destroy();
        this.factory.destroy();
    }

    getRenderedFeatureAt(x: number, y: number, layers): {
        id: number | string | null;
        z: number;
        layerIndex: number
    } {
        const {tiles} = this;
        // console.time('getRenderedFeatureAt');
        this.rayCaster.init(x, y, this.w, this.h, this.s, 1 / this.groundResolution);

        const camWorldZ = this.rayCaster.origin[2] - 0.001;

        let tileSize: number | string;
        for (tileSize in tiles) {
            tileSize = Number(tileSize);
            for (let gridTile of tiles[tileSize]) {
                const tileX = gridTile.x;
                const tileY = gridTile.y;
                const tile = <GLTile>gridTile.tile;
                const hitTile = this.rayCaster.intersectAABBox(tileX, tileY, 0, tileX + tileSize, tileY + tileSize, camWorldZ);
                if (!hitTile) continue;

                for (let i = 0, {data} = tile; i < data.length; i++) {
                    const {layer} = tile.layers[i];
                    const layerBuffers = data[i];
                    const layerIndex = layers.indexOf(layer);
                    if (!layerBuffers || layerIndex == -1) continue;
                    for (let buffer of layerBuffers) {
                        if (buffer.isFlat()) continue;
                        this.rayCaster.intersect(tileX, tileY, buffer, layerIndex);
                    }
                }
            }
        }
        const result = this.rayCaster.getIntersectionTop();

        // console.timeEnd('getRenderedFeatureAt');

        this.viewport(true);

        return result;
    }

    viewChangeDone() {
        this.viewChange = false;
        this.update();
    }

    scaleOffsetXYByAltitude(pointWorld: number[]): number {
        const mat = this.render.vPMat;
        return 1.0 - (pointWorld[2] * mat[11]) / (mat[3] * pointWorld[0] + mat[7] * pointWorld[1] + mat[15]);
    }
}

export default WebGlDisplay;
