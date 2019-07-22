using AirHockey.Engine.GameObjects;
using System;
using System.Collections.Generic;
using System.Text;

namespace AirHockey.Engine
{
    public class Player
    {
        public string Id { get; set; }

        public long Score { get; set; }

        public Mallet Mallet { get; set; }
    }
}
