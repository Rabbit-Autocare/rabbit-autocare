// ✅ AddressSection.js
"use client";

import AddressCard from "./AddressCard";
import AddressForm from "./AddressForm";
import { useState } from "react";

export default function AddressSection({ addresses: serverAddresses }) {
  const [addresses, setAddresses] = useState(serverAddresses || []);
  const [editingAddress, setEditingAddress] = useState(null);

  const handleAddOrUpdate = (newAddress) => {
    const exists = addresses.some((a) => a.id === newAddress.id);
    const updated = exists
      ? addresses.map((a) => (a.id === newAddress.id ? newAddress : a))
      : [newAddress, ...addresses];
    setAddresses(updated);
    setEditingAddress(null);
  };

  const handleDelete = (id) => {
    setAddresses(addresses.filter((a) => a.id !== id));
  };

  return (
    <div className="grid gap-6">
      <AddressForm
        onSuccess={handleAddOrUpdate}
        editingAddress={editingAddress}
        onCancel={() => setEditingAddress(null)}
      />

      {addresses.map((address) => (
        <AddressCard
          key={address.id}
          address={address}
          onEdit={() => setEditingAddress(address)}
          onDelete={() => handleDelete(address.id)}
        />
      ))}
    </div>
  );
}
