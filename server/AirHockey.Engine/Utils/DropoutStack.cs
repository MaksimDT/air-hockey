using System;
using System.Collections.Generic;
using System.Text;

namespace AirHockey.Engine.Utils
{
    public class DropoutStack<TItem>
    {
        private readonly object _syncRoot = new object();
        private readonly TItem[] _items;
        private int _itemsCount = 0;    // for boundary check
        private int _top = 0;

        public int Size => _items.Length;

        public DropoutStack(int size)
        {
            _items = new TItem[size];
        }

        public void Push(TItem item)
        {
            // circular buffer

            lock (_syncRoot)
            {
                _items[_top] = item;

                ++_top;
                if (_top >= _items.Length)
                {
                    _top %= _items.Length;
                }

                ++_itemsCount;
                if (_itemsCount > _items.Length)
                {
                    _itemsCount = _items.Length;
                }
            }
        }

        public bool TryPop(out TItem item)
        {
            lock (_syncRoot)
            {
                if (_itemsCount == 0)
                {
                    item = default;
                    return false;
                    throw new InvalidOperationException("Stack is empty");
                }

                --_itemsCount;
                --_top;
                if (_top == -1)
                {
                    _top = _items.Length - 1;
                }
                item = _items[_top];
                return true;
            }
        }
    }
}
