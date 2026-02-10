import '@playcanvas/web-components';
import {
    Asset,
    Entity,
    EventHandler,
    platform,
    type Texture,
    type AppBase,
    revision as engineRevision,
    version as engineVersion
} from 'playcanvas';

import { observe } from './core/observe';
import { importSettings } from './settings';
import type { Config, Global } from './types';
import { initPoster, initUI } from './ui';
import { Viewer } from './viewer';
import { initXr } from './xr';
import { version as appVersion } from '../package.json';

const loadGsplat = async (app: AppBase, config: Config, progressCallback: (progress: number) => void) => {
    const { contents, contentUrl, unified, aa } = config;
    const resolved = await contents;
    const c = resolved instanceof ArrayBuffer ? resolved : await (resolved as Response).arrayBuffer();
    const filename = new URL(contentUrl, location.href).pathname.split('/').pop() || 'splat';
    const data = filename.toLowerCase() === 'meta.json'
        ? JSON.parse(new TextDecoder().decode(c))
        : undefined;
    const asset = new Asset(filename, 'gsplat', { url: contentUrl || '', filename, contents: c }, data);

    return new Promise<Entity>((resolve, reject) => {
        asset.on('load', () => {
            const entity = new Entity('gsplat');
            // SOG and LOD-meta are PlayCanvas format (correct orientation); PLY may need 180° flip
            const rotZ = filename.toLowerCase().endsWith('.sog') || filename.toLowerCase().endsWith('lod-meta.json') ? 0 : 180;
            entity.setLocalEulerAngles(0, 0, rotZ);
            entity.addComponent('gsplat', {
                unified: unified || filename.toLowerCase().endsWith('lod-meta.json'),
                asset
            });
            const material = entity.gsplat.unified ? app.scene.gsplat.material : entity.gsplat.material;
            material.setDefine('GSPLAT_AA', aa);
            material.setParameter('alphaClip', 1 / 255);
            app.root.addChild(entity);
            resolve(entity);
        });

        let watermark = 0;
        asset.on('progress', (received, length) => {
            const progress = Math.min(1, received / length) * 100;
            if (progress > watermark) {
                watermark = progress;
                progressCallback(Math.trunc(watermark));
            }
        });

        asset.on('error', (err) => {
            console.log(err);
            reject(err);
        });

        app.assets.add(asset);
        app.assets.load(asset);
    });
};

const loadSkybox = (app: AppBase, url: string) => {
    return new Promise<Asset>((resolve, reject) => {
        const asset = new Asset('skybox', 'texture', {
            url
        }, {
            type: 'rgbp',
            mipmaps: false,
            addressu: 'repeat',
            addressv: 'clamp'
        });

        asset.on('load', () => {
            resolve(asset);
        });

        asset.on('error', (err) => {
            console.log(err);
            reject(err);
        });

        app.assets.add(asset);
        app.assets.load(asset);
    });
};

const main = async (app: AppBase, camera: Entity, settingsJson: any, config: Config) => {
    const events = new EventHandler();

    const state = observe(events, {
        loaded: false,
        readyToRender: false,
        hqMode: true,
        progress: 0,
        inputMode: platform.mobile ? 'touch' : 'desktop',
        cameraMode: 'orbit',
        hasAnimation: false,
        animationDuration: 0,
        animationTime: 0,
        animationPaused: true,
        hasAR: false,
        hasVR: false,
        isFullscreen: false,
        controlsHidden: false
    });

    const global: Global = {
        app,
        settings: importSettings(settingsJson),
        config,
        state,
        events,
        camera
    };

    // Initialize the load-time poster
    if (config.poster) {
        initPoster(events);
    }

    camera.addComponent('camera');

    // Initialize XR support
    initXr(global);

    // Initialize user interface
    initUI(global);

    // Load model
    const gsplatLoad = loadGsplat(
        app,
        config,
        (progress: number) => {
            state.progress = progress;
        }
    );

    // Load skybox
    const skyboxLoad = config.skyboxUrl &&
        loadSkybox(app, config.skyboxUrl).then((asset) => {
            app.scene.envAtlas = asset.resource as Texture;
        });

    // Load and play sound
    if (global.settings.soundUrl) {
        const sound = new Audio(global.settings.soundUrl);
        sound.crossOrigin = 'anonymous';
        document.body.addEventListener('click', () => {
            if (sound) {
                sound.play();
            }
        }, {
            capture: true,
            once: true
        });
    }

    // Create the viewer
    const viewer = new Viewer(global, gsplatLoad, skyboxLoad);

    // Await load so failures propagate to caller
    await gsplatLoad;

    return viewer;
};

console.log(`SuperSplat Viewer v${appVersion} | Engine v${engineVersion} (${engineRevision})`);

export { main };
