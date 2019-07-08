using AirHockey.Engine.Geometry;
using System;
using System.Collections.Generic;
using System.Text;
using System.Linq;

namespace AirHockey.Engine
{
    public interface IGameObject
    {
        IGeometry Geometry { get; }
        Vector Velocity { get; }
        int Weight { get; }
        CollisionInfo GetCollisionInfo(IGameObject other);
        ISet<int> CollisionGroups { get; }
    }

    public abstract class GameObject<TGeometry, TPosition> : IGameObject
        where TGeometry : GeometryBase<TPosition>
    {
        public TGeometry Geometry { get; }
        public Vector Velocity { get; private set; }
        public MoveContext MoveCtx { get; }
        public ISet<int> CollisionGroups { get; }
        public int Weight { get; }

        protected bool ReactsToCollisions => false;

        IGeometry IGameObject.Geometry => Geometry;

        public GameObject(
            TGeometry geometry, 
            Vector velocity, 
            MoveContext moveCtx, 
            IEnumerable<int> collisionGroups, 
            int weight = 1)
        {
            Geometry = geometry;
            Velocity = velocity;
            MoveCtx = moveCtx;
            if (collisionGroups != null)
            {
                CollisionGroups = new HashSet<int>(collisionGroups);
            }
            else
            {
                CollisionGroups = new HashSet<int>();
            }
            Weight = weight;
        }

        public CollisionInfo GetCollisionInfo(IGameObject other)
        {
            var cg = Geometry.GetCollisionGeometry(other.Geometry);
            if (cg == null)
            {
                return null;
            }

            // breaking down velocities of the objects into two compontents: 
            // first that is parallel to collision line (axis "y") and second that is orthogonal to it (axis "x")

            var y = cg.CollisionLine;
            var x = y.GetOrthogonalLine();

            // HACK: special handling for circles...
            if (Geometry is Circle && other.Geometry is Circle)
            {
                var m1 = Weight;
                var m2 = other.Weight;
                var v1x_vect = Velocity.ProjectOn(x);
                var v2x_vect = Velocity.ProjectOn(x);

                var v1x = v1x_vect.Modulus;
                var v2x = v2x_vect.Modulus;

                if (v1x_vect.LooksInDifferentDirection(x.GetCollinearVector()))
                {
                    v1x = -v1x;
                }

                if (v2x_vect.LooksInDifferentDirection(x.GetCollinearVector()))
                {
                    v2x = -v2x;
                }

                var v1x_new = ((m1 - m2) * v1x + 2 * m2 * v2x) / (m1 + m2);
                var v2x_new = (2 * m1 * v1x + (m2 - m1) * v2x) / (m1 + m2);

                var velocity1 = Velocity.ProjectOn(y).Add(x.GetCollinearVector().ScaleTo(v1x_new));
                var velocity2 = Velocity.ProjectOn(y).Add(x.GetCollinearVector().ScaleTo(v2x_new));

                return new CollisionInfo(cg.Fallback1, velocity1, cg.Fallback2, velocity2);
            }
            else
            {
                var velocity1 = Velocity.ProjectOn(y).Add(Velocity.ProjectOn(x).TurnAround());
                var velocity2 = other.Velocity.ProjectOn(y).Add(Velocity.ProjectOn(x).TurnAround());
                return new CollisionInfo(cg.Fallback1, velocity1, cg.Fallback2, velocity2);
            }
        }

        public void OnTick()
        {
            var acc = MoveCtx.Acceleration;

            if (!acc.IsZeroVector)
            {
                Velocity = Velocity.Add(acc);
            }
            else
            {
                Velocity = Velocity.MultiplyByScalar(1 / MoveCtx.DampingCoeff);
            }

            if (Velocity.Modulus < MoveCtx.MinVelocity)
            {
                Velocity = Velocity.ScaleTo(MoveCtx.MinVelocity);
            }

            Geometry.Move(Velocity);
        }

        public bool NeedsCollisionHandling(IGameObject other)
        {
            return CollisionGroups.Overlaps(other.CollisionGroups);
        }

        public virtual void OnCollision(IGameObject other, Vector fallback, Vector velocity)
        {
            if (FallsBack(other))
            {
                Geometry.Move(fallback);
            }
            Velocity = velocity;
        }

        protected virtual bool FallsBack(IGameObject other) => false;
    }
}
