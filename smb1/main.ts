import "../phaser262/build/phaser";

console.log('This  is Typescript Main.');

class Greeting {
    constructor(public greeting: string) { }
    greet() {
        return '<h1>' + this.greeting + '</h1>';
    }
};


class SimpleGame {
    constructor() {
        this.game = new Phaser.Game(800, 600, Phaser.AUTO, 'content', { preload: this.preload, create: this.create });
    }
    
    game: Phaser.Game;
    
    preload() {
        this.game.load.image('logo', 'phaser2.png');
    }
    
    create() {
        let logo = this.game.add.sprite(this.game.world.centerX, this.game.world.centerY, 'logo');
        logo.anchor.setTo(0.5, 0.5);
    }
};

window.onload = () => {
    let game = new SimpleGame();
};


let greeter = new Greeting('Hello Phaser! again..');

document.body.innerHTML = greeter.greet();
