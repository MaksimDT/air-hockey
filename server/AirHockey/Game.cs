using Microsoft.Extensions.Logging;
using System;
using System.Collections.Concurrent;
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
        private WebSocket _left;
        private readonly ILogger _logger;
        private WebSocket _right;
        private readonly BlockingCollection<byte[]> _bufForRight = new BlockingCollection<byte[]>();
        private readonly BlockingCollection<byte[]> _bufForLeft = new BlockingCollection<byte[]>();

        public Game(string name, WebSocket conn, ILogger logger)
        {
            _name1 = name;
            _left = conn;
            _logger = logger;
        }

        public async Task WaitJoin()
        {
            while (true)
            {
                await Task.Delay(TimeSpan.FromSeconds(3));
                //if (_right != null)
                //{
                //    _logger.LogInformation("Player {name} starts playing", _name1);
                //    return;
                //}
            }
        }

        public async Task JoinAndStart(WebSocket conn, string name, CancellationToken ct)
        {
            _right = conn;

            _bufForLeft.Add(Encoding.UTF8.GetBytes("left"));
            _bufForRight.Add(Encoding.UTF8.GetBytes("right"));

            var lro = RunRead(_left, _bufForRight, ct, "l2r");
            var lri = RunWrite(_bufForRight, _right, ct, "l2r");
            var rlo = RunRead(_right, _bufForLeft, ct, "r2l");
            var rli = RunWrite(_bufForLeft, _left, ct, "r2l");

            await Task.WhenAll(lro, lri, rlo, rli);
        }

        private Task RunRead(WebSocket from, BlockingCollection<byte[]> to, CancellationToken ct, string name)
        {
            return Task.Run(async () =>
            {
                try
                {
                    var buffer = new byte[1024 * 4];

                    while (true)
                    {
                        var res = await from.ReceiveAsync(new ArraySegment<byte>(buffer), ct);
                        if (res.CloseStatus.HasValue)
                        {
                            _logger.LogDebug("Input socket closed {name}", name);
                            to.CompleteAdding();
                            break;
                        }
                        to.Add(new ArraySegment<byte>(buffer, 0, res.Count).ToArray());
                    }

                    _logger.LogDebug("Exited RunRead {name}!!!", name);
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Exception in RunRead {name}!!!", name);
                }
            });
        }

        private Task RunWrite(BlockingCollection<byte[]> from, WebSocket to, CancellationToken ct, string name)
        {
            return Task.Run(async () =>
            {
                try
                {
                    var buffer = new byte[1024 * 4];

                    while (!from.IsCompleted)
                    {
                        if (to.CloseStatus.HasValue)
                        {
                            _logger.LogDebug("Output socket closed {name}", name);
                            break;
                        }
                        var msg = from.Take(ct);
                        await to.SendAsync(new ArraySegment<byte>(msg), WebSocketMessageType.Text, true, ct);
                    }

                    _logger.LogDebug("Exited RunWrite {name}!!!", name);

                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Exception in RunWrite {name}!!!", name);
                }
            });
        }

        //private async Task Run(CancellationToken ct)
        //{
        //    var buffer1 = new byte[1024 * 4];
        //    var buffer2 = new byte[1024 * 4];
        //    var b1 = Encoding.UTF8.GetBytes("left", 0, 4, buffer1, 0);
        //    var b2 = Encoding.UTF8.GetBytes("right", 0, 4, buffer2, 0);

        //    await _left.SendAsync(new ArraySegment<byte>(buffer1, 0, b1), WebSocketMessageType.Text, true, ct);
        //    await _right.SendAsync(new ArraySegment<byte>(buffer2, 0, b2), WebSocketMessageType.Text, true, ct);

        //    while (true)
        //    {
        //        var res1 = await _left.ReceiveAsync(new ArraySegment<byte>(buffer1), ct);
        //        var res2 = await _right.ReceiveAsync(new ArraySegment<byte>(buffer2), ct);
        //        if (res1.CloseStatus.HasValue)
        //        {
        //            continue;
        //        }
        //        if (res2.CloseStatus.HasValue)
        //        {
        //            continue;
        //        }
        //        await _left.SendAsync(new ArraySegment<byte>(buffer2, 0, res2.Count), res2.MessageType, res2.EndOfMessage, ct);
        //        await _right.SendAsync(new ArraySegment<byte>(buffer1, 0, res2.Count), res1.MessageType, res1.EndOfMessage, ct);
        //    }
        //}
    }
}
