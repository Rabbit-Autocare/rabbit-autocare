"use client";

export default function AddressCard({ address, onEdit, onDelete }) {
  return (
    <div className="bg-white border rounded-lg p-4 space-y-2">
      <div className="font-medium">{address.full_name}</div>
      <div className="text-sm text-gray-600">{address.phone}</div>
      <div className="text-sm text-gray-600">{address.street}, {address.city}, {address.state} - {address.postal_code}</div>
      <div className="text-xs text-gray-500">Type: {address.address_type}</div>
      <div className="flex gap-2 mt-2">
        <button onClick={onEdit} className="text-blue-600 text-sm font-medium">Edit</button>
        <button onClick={onDelete} className="text-red-600 text-sm font-medium">Delete</button>
      </div>
    </div>
  );
}
