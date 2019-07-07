using System;
using System.Collections.Generic;
using System.Text;

namespace AirHockey.Engine.Geometry
{
    public interface IGeometry
    {
        CollisionGeometry GetCollisionGeometry(IGeometry other);
        void Move(Vector v);
    }

    public abstract class GeometryBase<TPosition> : IGeometry
    {
        protected readonly PositionsHistory<TPosition> PositionsHistory;

        public GeometryBase()
        {
            PositionsHistory = new PositionsHistory<TPosition>(10);
        }

        public void Move(Vector v)
        {
            SavePrevPosition();
            MoveInternal(v);
        }

        public abstract CollisionGeometry GetCollisionGeometry(IGeometry other);

        protected abstract TPosition GetCurrentPosition();
        protected abstract void RestorePrevPosition();
        protected abstract void MoveInternal(Vector v);

        private void SavePrevPosition()
        {
            var pos = GetCurrentPosition();
            PositionsHistory.SavePosition(pos);
        }
    }
}
