"use client";

import { useState, useEffect } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser-client";
import { useAuth } from "@/contexts/AuthContext";

export default function AddressForm({ editingAddress, onSuccess, onCancel }) {
  const { user } = useAuth();
  const supabase = createSupabaseBrowserClient();

  const [form, setForm] = useState({
    full_name: "",
    phone: "",
    street: "",
    city: "",
    state: "",
    postal_code: "",
    address_type: "home",
    is_default: false,
  });

  useEffect(() => {
    if (editingAddress) setForm(editingAddress);
  }, [editingAddress]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { data, error } = editingAddress
      ? await supabase.from("addresses").update(form).eq("id", editingAddress.id).select().single()
      : await supabase.from("addresses").insert({ ...form, user_id: user.id }).select().single();

    if (error) return alert("Failed to save address");

    onSuccess(data);
    setForm({
      full_name: "",
      phone: "",
      street: "",
      city: "",
      state: "",
      postal_code: "",
      address_type: "home",
      is_default: false,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="grid gap-2 bg-white p-4 rounded border">
      {["full_name", "phone", "street", "city", "state", "postal_code"].map((field) => (
        <input
          key={field}
          name={field}
          placeholder={field.replace("_", " ").toUpperCase()}
          value={form[field]}
          onChange={handleChange}
          className="border rounded px-3 py-2 text-sm"
          required
        />
      ))}
      <select name="address_type" value={form.address_type} onChange={handleChange} className="border rounded px-3 py-2 text-sm">
        <option value="home">Home</option>
        <option value="work">Work</option>
        <option value="other">Other</option>
      </select>
      <label className="flex gap-2 items-center">
        <input type="checkbox" name="is_default" checked={form.is_default} onChange={handleChange} />
        Set as default
      </label>
      <div className="flex gap-2">
        <button type="submit" className="bg-blue-600 text-white px-4 py-2 text-sm rounded">
          {editingAddress ? "Update" : "Add"} Address
        </button>
        {editingAddress && (
          <button type="button" onClick={onCancel} className="text-gray-600 text-sm">Cancel</button>
        )}
      </div>
    </form>
  );
}
