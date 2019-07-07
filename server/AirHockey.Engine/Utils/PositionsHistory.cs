using AirHockey.Engine.Utils;
using System;
using System.Collections.Generic;
using System.Text;

namespace AirHockey.Engine
{
    public class PositionsHistory<TPosition>
    {
        private readonly DropoutStack<TPosition> _storage;

        public PositionsHistory(int size)
        {
            _storage = new DropoutStack<TPosition>(size);
        }

        public void SavePosition(TPosition pos)
        {
            _storage.Push(pos);
        }

        public bool TryGetLastPosition(out TPosition pos)
        {
            return _storage.TryPop(out pos);
        }
    }
}
