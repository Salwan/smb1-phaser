/// <reference path="../phaser262/typescript/phaser.d.ts" />

import '../phaser262/build/phaser.min.js';

const WIDTH = 512.0;
const HEIGHT = 480.0;
const RESMULX = 2.0;
const RESMULY = 2.0;

let phaser : Phaser.Game;

class SMBGame {
    currentScene: Scene;

    public constructor() {
        phaser = new Phaser.Game(WIDTH, HEIGHT, Phaser.AUTO, 'content', { 
            preload: () => { this.preload(); },
            create: () => { this.create(); },
            update: () => { this.update(); }, 
            render: () => { this.render(); } 
        }, false, false);
    }

    public preload() {
        phaser.stage.backgroundColor = 0x5c94fc;
        phaser.load.image('logo', './smb1/assets/title.fw.png');
        phaser.load.bitmapFont('emulogic', './smb1/assets/fonts/emulogic_0.png', './smb1/assets/fonts/emulogic.fnt');
    }
    
    public changeScene(scene:Scene):void {
        if(scene) {
            if(this.currentScene) {
                this.currentScene.destroy();
            }
            phaser.world.removeAll();
            scene.create();
            this.currentScene = scene;
        }
    }

    public create():void {
        let start_screen:StartScreen = new StartScreen();
        this.changeScene(start_screen);
    }

    public update():void {
        if(this.currentScene) {
            this.currentScene.update();
        }
    }

    public render():void {
        if(this.currentScene) {
            this.currentScene.render();
        }
    }
};

class Scene {
    public create():void { };
    public update():void { };
    public render():void { };
    public destroy():void { };
};

class StartScreen extends Scene {
    public create():void {
        let logo = phaser.add.sprite(phaser.world.centerX, phaser.world.centerY, 'logo');
        logo.anchor.setTo(0.5, 1.0);
        logo.scale.setTo(2.0, 2.0);
        
        let copyright_txt = phaser.add.bitmapText(104 * RESMULX, 119 * RESMULY, 'emulogic', '\xA91985 NINTENDO', 12 * RESMULX);
        copyright_txt.tint = 0xfcbcb0;
        phaser.add.bitmapText(28 * RESMULX, 142 * RESMULY, 'emulogic', 'PRESS SPACE/BTN1 TO START', 12 * RESMULX);
    }
    
    public update():void {
        
    }
    
    public render():void {
        
    }
    
    public destroy():void {
        
    }
};

/*class InfoScreen extends Scene {

};

class LevelScene extends Scene {

};
*/

document.body.innerHTML = '';
 
let game = new SMBGame();
