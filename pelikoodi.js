//Scenen generointi
let gameScene = new Phaser.Scene("Game");

var config = {
    type: Phaser.WEBGL,
    width: 640,
    height: 480,
    backgroundColor: '#dd517e',
    //parent: 'phaser-example',   // ei käytössä
    scene: {                      // voisi olla yksinkertaisimmillaan gameScene, määritellään (vaihtoehtoiset) vakiometodit:
        preload: preload,
        create: create,
        update: update
    }
};

// Muuttujat

var snake;
var food;
var cursors; // directional-näppäimet

// direction-vakiot
var UP = 0;
var DOWN = 1;
var LEFT = 2;
var RIGHT = 3;

let game = new Phaser.Game(config); // Peliobjekti luodaan konfiguraation mukaan




// Assettien esilataaminen
function preload ()
{
    this.load.image('food', 'food.png');
    this.load.image('body', 'body.png');
    this.load.image('body2', 'body2.png');

}


// Kutsutaan kerran, kun esiladattu
function create ()
{
    

    var Food = new Phaser.Class({

        Extends: Phaser.GameObjects.Image,

        initialize:

        function Food (scene, x, y)
        {
            Phaser.GameObjects.Image.call(this, scene)

            this.setTexture('food');
            this.setPosition(x * 16, y * 16);
            this.setOrigin(0);

            this.total = 0;

            scene.children.add(this);
        },


        eat: function ()
        {
            this.total++;

        }

    });


    var Snake = new Phaser.Class({

        initialize:

        function Snake (scene, x, y)
        {
            this.headPosition = new Phaser.Geom.Point(x, y);
            this.body = scene.add.group();

            this.head = this.body.create(x * 16, y * 16, 'body');
            this.head.setOrigin(0);  // Vasen laita originiin

            this.alive = true;
            this.speed = 100;
            this.moveTime = 0;

            this.tail = new Phaser.Geom.Point(x, y);

            this.heading = RIGHT;  // Minne liikutaan seuraavaksi
            this.direction = RIGHT;  // Minne liikutaan nyt
        },

        update: function (time)
        {
            if (time >= this.moveTime)   // Jos on aika taas liikkua
            {
                return this.move(time); // Liikutaan määriteltyyn suuntaan
            }
        },

        // Sallitaan vain 90 asteen kääntyminen seuraavilla metodeilla:

        faceLeft: function ()
        {
            if (this.direction === UP || this.direction === DOWN)
            {
                this.heading = LEFT;
            }
        },

        faceRight: function ()
        {
            if (this.direction === UP || this.direction === DOWN)
            {
                this.heading = RIGHT;
            }
        },

        faceUp: function ()
        {
            if (this.direction === LEFT || this.direction === RIGHT)
            {
                this.heading = UP;
            }
        },

        faceDown: function ()
        {
            if (this.direction === LEFT || this.direction === RIGHT)
            {
                this.heading = DOWN;
            }
        },

        move: function (time)
        {
            /**
            * Päivittää headposition:ia
            * The Math.wrap hoitaa pelaajan (snake) pelimaailman vastakkaisesta seinästä ilmestymisen
            */
            switch (this.heading)
            {
                case LEFT:
                    this.headPosition.x = Phaser.Math.Wrap(this.headPosition.x - 1, 0, 40);
                    break;

                case RIGHT:
                    this.headPosition.x = Phaser.Math.Wrap(this.headPosition.x + 1, 0, 40);
                    break;

                case UP:
                    this.headPosition.y = Phaser.Math.Wrap(this.headPosition.y - 1, 0, 30);
                    break;

                case DOWN:
                    this.headPosition.y = Phaser.Math.Wrap(this.headPosition.y + 1, 0, 30);
                    break;
            }

            this.direction = this.heading; 

            // Päivitetään pelaajan häntää
            Phaser.Actions.ShiftPosition(this.body.getChildren(), this.headPosition.x * 16, this.headPosition.y * 16, 1);
            
            //  Check to see if any of the body pieces have the same x/y as the head
            //  If they do, the head ran into the body

            var hitBody = Phaser.Actions.GetFirst(this.body.getChildren(), { x: this.head.x, y: this.head.y }, 1);

            if (hitBody) //jos kuoltiin
            {
                console.log('dead');

                this.alive = false;

                return false;
            }
            else
            {
                //  Päivitetään ajastinta, peli jatkuu
                this.moveTime = time + this.speed;

                return true;
            }
        },
        
        grow: function ()
        {
            var newPart = this.body.create(this.tail.x, this.tail.y, 'body2');

            newPart.setOrigin(0);
        },

        collideWithFood: function (food)
        {
            if (this.head.x === food.x && this.head.y === food.y)
            {
                this.grow();
                food.eat();
                if (this.speed > 20 && food.total % 4 === 0 )
                {
                    this.speed -= 4; // joka 3. ruoka nopeutetaan
                }

                return true;
            }
            else
            {
                return false;
            }
        },

        updateGrid: function (grid)
        {
            //  Valideista grideistä poistetaan kaikki nykyiset käärmeen paikat
            this.body.children.each(function (segment) {

                var bx = Math.floor(segment.x / 16);   // halutaan kokonaislukuja, joten pyöristetään
                var by =  Math.floor(segment.y / 16);

                grid[by][bx] = false;

            });

            return grid;
        }

    });

    
    food = new Food(this, 3, 4);


    snake = new Snake(this, 8, 8);

    //  cursors vastaa suuntapainikkeita
    cursors = this.input.keyboard.createCursorKeys();
}




// Kutsutaan joka frame pelissä
function update (time, delta)
{
    if (!snake.alive)
    {
        return;
    }

    /**
    * Tarkistetaan onko painiketta painettu validiin suuntaan
    */
    if (cursors.left.isDown)
    {
        snake.faceLeft();
    }
    else if (cursors.right.isDown)
    {
        snake.faceRight();
    }
    else if (cursors.up.isDown)
    {
        snake.faceUp();
    }
    else if (cursors.down.isDown)
    {
        snake.faceDown();
    }

    if (snake.update(time))
    {
        if (snake.collideWithFood(food)) {
            repositionFood();
        }
    }
}


/**
* Pistetään ruoka kohtaan, jossa ei pelaajaa
* @method repositionFood
* @return {boolean} true if the food was placed, otherwise false
*/
function repositionFood ()
{
    // Kenttä jonka perusteella uusi ruoka spawnataan
    var testGrid = [];

    for (var y = 0; y < 30; y++)
    {
        testGrid[y] = [];

        for (var x = 0; x < 40; x++)
        {
            testGrid[y][x] = true;
        }
    }

    snake.updateGrid(testGrid);

    //  Poistetaan kielletyt positiot
    var validLocations = [];

    for (var y = 0; y < 30; y++)
    {
        for (var x = 0; x < 40; x++)
        {
            if (testGrid[y][x] === true)
            {
                //  Lisätään ruoka, jos positio on tyhjä
                validLocations.push({ x: x, y: y });
            }
        }
    }

    if (validLocations.length > 0)
    {
        //  Satunnainen paikan valinta
        var pos = Phaser.Math.RND.pick(validLocations);

        //  Ruoan luominen
        food.setPosition(pos.x * 16, pos.y * 16);

        return true;
    }
    else
    {
        return false;
    }
}