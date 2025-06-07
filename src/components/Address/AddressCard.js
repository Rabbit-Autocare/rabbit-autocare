import React from 'react';

export default function AddressCard({ address, isSelected, onSelect, onEdit, onDelete }) {
  // Basic component structure - replace with your actual AddressCard implementation
  return (
    <div
      className={`p-4 border rounded-lg ${isSelected ? 'border-blue-500 bg-blue-50' : 'border-gray-300'}`}
      onClick={() => onSelect(address)}
    >
      <div className="font-semibold">{address?.name}</div>
      <div className="text-sm text-gray-600">
        {address?.address_line1}, {address?.city}, {address?.state} - {address?.postal_code}
      </div>
      {address?.address_line2 && <div className="text-sm text-gray-600">{address?.address_line2}</div>}
      <div className="text-sm text-gray-600">{address?.phone}</div>
      <div className="mt-2">
        <button
          onClick={(e) => { e.stopPropagation(); onEdit(address); }}
          className="text-blue-600 hover:underline mr-4"
        >
          Edit
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); onDelete(address); }}
          className="text-red-600 hover:underline"
        >
          Delete
        </button>
      </div>
    </div>
  );
}
