function BillingComponent({
  bill,
  customer,
  discount,
  fine,
  setDiscount,
  setFine,
  onAddItem,
  onPay,
  onBack
}: {
  bill: Bill | null;
  customer: Customer | null;
  discount: number;
  fine: number;
  setDiscount: (val: number) => void;
  setFine: (val: number) => void;
  onAddItem: () => void;
  onPay: () => void;
  onBack: () => void;
}) {
  const total = bill.amount - discount + fine;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">Billing</h2>
        <button onClick={onBack} className="text-gray-500">Back</button>
      </div>

      {/* Customer Details */}
      <div className="bg-gray-100 p-4 rounded-lg">
        <p className="font-semibold">{customer?.name}</p>
        <p className="text-sm text-gray-600">{customer?.phone}</p>
        <p className="text-sm">Table {customer?.tableNumber}</p>
      </div>

      {/* Dishes List */}
      <div>
        <p className="text-lg font-semibold mb-2">Items</p>
        <div className="bg-white shadow rounded-lg p-4 space-y-2">
         {Array.isArray(bill?.dishes) ? (
  bill.dishes.map((d : { name: string; quantity: number; price: number }, idx:number) => (
    <div key={idx} className="flex justify-between">
      <span>{d.name} × {d.quantity}</span>
      <span>₹{d.price * d.quantity}</span>
    </div>
  ))
) : Array.isArray(bill?.items) ? (
  bill.items.map((name : string, idx:number) => (
    <div key={idx} className="flex justify-between">
      <span>{name}</span>
      <span>₹--</span>
    </div>
  ))
) : (
  <p className="text-gray-500">No items found</p>
)}
        </div>
      </div>

      {/* Total */}
      <div className="bg-emerald-50 p-4 rounded-lg flex justify-between">
        <p className="font-bold">Subtotal</p>
        <p className="font-bold">₹{bill.amount}</p>
      </div>

      {/* Discount / Fine */}
      <div className="space-y-3">
        <input
          type="number"
          className="w-full border p-2 rounded"
          placeholder="Add Discount"
          value={discount || ''}
          onChange={(e) => setDiscount(Number(e.target.value))}
        />
        <input
          type="number"
          className="w-full border p-2 rounded"
          placeholder="Add Fine"
          value={fine || ''}
          onChange={(e) => setFine(Number(e.target.value))}
        />
        <div className="flex justify-between font-bold">
          <span>Total Payable</span>
          <span>₹{total}</span>
        </div>
      </div>

      {/* Add More Items & Pay */}
      <div className="flex gap-3">
        <button onClick={onAddItem} className="flex-1 bg-gray-200 py-3 rounded-lg font-bold">Add Items</button>
        <button onClick={onPay} className="flex-1 bg-emerald-500 text-white py-3 rounded-lg font-bold">Pay Bill</button>
      </div>
    </div>
  );
}

export default BillingComponent;