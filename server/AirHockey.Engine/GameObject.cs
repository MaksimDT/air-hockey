using AirHockey.Engine.Geometry;
using System;
using System.Collections.Generic;
using System.Text;

namespace AirHockey.Engine
{
    public interface IGameObject
    {
        IGeometry Geometry { get; }
        Vector Velocity { get; }
        (CollisionInfo ci1, CollisionInfo ci2) GetCollisionInfo(IGameObject other);
    }

    public abstract class GameObject<TGeometry, TPosition> : IGameObject
        where TGeometry : GeometryBase<TPosition>
    {
        public TGeometry Geometry { get; }
        public Vector Velocity { get; }
        IGeometry IGameObject.Geometry => Geometry;

        public GameObject(TGeometry geometry, Vector velocity)
        {
            Geometry = geometry;
            Velocity = velocity;
        }

        public (CollisionInfo ci1, CollisionInfo ci2) GetCollisionInfo(IGameObject other)
        {
            var cg = Geometry.GetCollisionGeometry(other.Geometry);
            if (cg == null)
            {
                return (null, null);
            }

            // breaking down velocities of the objects into two compontents: 
            // first that is parallel to collision line (axis "y") and second that is orthogonal to it (axis "x")

            var y = cg.CollisionLine;
            var x = y.GetOrthogonalLine();

            // HACK: special handling of Circle-Line collisions
            var geom1 = cg.First.Geometry;
            var geom2 = cg.Second.Geometry;

            if (geom1 is Circle c && geom2 is LineSegment l)
            {
                return HandleCircleLineCollision(c, l);
            }
            else if (geom1 is LineSegment l1 && geom2 is Circle c1)
            {
                return HandleCircleLineCollision(c1, l1);
            }
            else
            {
                var velocity1 = Velocity.ProjectOn(y).Add(Velocity.ProjectOn(x).TurnAround());
                var velocity2 = other.Velocity.ProjectOn(y).Add(Velocity.ProjectOn(x).TurnAround());
                var ci1 = new CollisionInfo(this, cg.First.Fallback, velocity1);
                var ci2 = new CollisionInfo(other, cg.Second.Fallback, velocity2);

                return (ci1, ci2);
            }
        }

        private (CollisionInfo ci1, CollisionInfo ci2) HandleCircleLineCollision(Circle circle, LineSegment line)
        {

        }
    }
}
