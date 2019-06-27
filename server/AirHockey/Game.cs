using System;
using System.Collections.Generic;
using System.Linq;
using System.Net.WebSockets;
using System.Text;
using System.Threading;
using System.Threading.Tasks;

namespace AirHockey
{
    public class Game
    {
        private readonly string _name1;
        private WebSocket _ws1;
        private WebSocket _ws2;

        public Game(string name1, WebSocket ws1)
        {
            _name1 = name1;
            _ws1 = ws1;
        }

        public async Task WaitJoin()
        {
            while (true)
            {
                await Task.Delay(TimeSpan.FromSeconds(3));
                if (_ws2 != null)
                    return;
            }
        }

        public async Task JoinAndStart(WebSocket ws, string name, CancellationToken ct)
        {
            if (name == _name1)
                _ws1 = ws;
            else
            {
                _ws2 = ws;
                await Run(ct);
            }
        }

        private async Task Run(CancellationToken ct)
        {
            var buffer1 = new byte[1024 * 4];
            var buffer2 = new byte[1024 * 4];
            var b1 = Encoding.UTF8.GetBytes("left", 0, 4, buffer1, 0);
            var b2 = Encoding.UTF8.GetBytes("right", 0, 4, buffer2, 0);

            await _ws1.SendAsync(new ArraySegment<byte>(buffer1, 0, b1), WebSocketMessageType.Text, true, ct);
            await _ws2.SendAsync(new ArraySegment<byte>(buffer2, 0, b2), WebSocketMessageType.Text, true, ct);

            while (true)
            {
                var res1 = await _ws1.ReceiveAsync(new ArraySegment<byte>(buffer1), ct);
                var res2 = await _ws2.ReceiveAsync(new ArraySegment<byte>(buffer2), ct);
                if (res1.CloseStatus.HasValue)
                {
                    continue;
                }
                if (res2.CloseStatus.HasValue)
                {
                    continue;
                }
                await _ws1.SendAsync(new ArraySegment<byte>(buffer2, 0, res2.Count), res2.MessageType, res2.EndOfMessage, ct);
                await _ws2.SendAsync(new ArraySegment<byte>(buffer1, 0, res2.Count), res1.MessageType, res1.EndOfMessage, ct);
            }
        }
    }
}
