using System;
using System.Collections.Concurrent;
using System.Collections.Generic;
using System.Linq;
using System.Net.WebSockets;
using System.Threading;
using System.Threading.Tasks;

namespace AirHockey
{
    public class GamePool
    {
        private readonly Dictionary<string, Game> _games = new Dictionary<string, Game>();

        public async Task Join(string gameId, string username, WebSocket ws, CancellationToken ct)
        {
            // TODO: locks

            if (_games.TryGetValue(gameId, out var game))
            {
                await game.JoinAndStart(ws, username, ct);
            }
            else
            {
                var g = new Game(username, ws);
                _games[gameId] = g;
                await g.WaitJoin();
            }
        }
    }
}
