using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;

namespace AirHockey.Engine
{
    public class GameField
    {
        private const double MalletRadius = 50;
        private const double BallRadius = 25;

        private readonly double _width = 1000;
        private readonly double _height = 1000;
        private readonly List<Player> _players;

        public GameField(IEnumerable<string> playerIds)
        {
            _players = playerIds.Select(pid => new Player()
            {
                Id = pid,
                Score = 0
            }).ToList();
            InitGameObjects();
        }

        public void Start()
        {
            InitGameObjects();
        }

        private void InitGameObjects()
        {
            InitMallets();
        }

        private void InitMallets()
        {
            var random = new Random();

            var minX = MalletRadius + 1;
            var minY = MalletRadius + 1;
            var maxX = _width - MalletRadius - 1;
            var maxY = _height - MalletRadius - 1;

            foreach (var player in _players)
            {
                var x = random.Next((int)minX, (int)maxX);
                var y = random.Next((int)minY, (int)maxY);
                var p = new Geometry.Point(x, y);

                var circle = new Geometry.Circle(p, MalletRadius);
                player.Mallet = new GameObjects.Mallet(
                    circle,
                    Geometry.Vector.Zero,
                    new MoveContext(BallRadius / 5, 0, 1.2));
            }
        }
    }
}
