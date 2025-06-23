"use client";
import React, { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";

const AddressSection = ({ userId, selectedAddressId, setSelectedAddressId }) => {
	const [addresses, setAddresses] = useState([]);
	const [loading, setLoading] = useState(true);
	const [showAddForm, setShowAddForm] = useState(false);
	const [editingAddress, setEditingAddress] = useState(null);
	const [formData, setFormData] = useState({
		full_name: "",
		phone: "",
		street: "",
		city: "",
		state: "",
		postal_code: "",
		address_type: "home"
	});

	useEffect(() => {
		if (userId) {
			fetchAddresses();
		}
	}, [userId]);

	const fetchAddresses = async () => {
		try {
			setLoading(true);
			const { data, error } = await supabase
				.from("addresses")
				.select("*")
				.eq("user_id", userId)
				.order("created_at", { ascending: false });

			if (error) throw error;

			setAddresses(data || []);
			
			// Auto-select first address if none selected
			if (data && data.length > 0 && !selectedAddressId) {
				setSelectedAddressId(data[0].id);
			}
		} catch (error) {
			console.error("Error fetching addresses:", error);
		} finally {
			setLoading(false);
		}
	};

	const handleSubmit = async (e) => {
		e.preventDefault();
		
		try {
			setLoading(true);
			
			const addressData = {
				...formData,
				user_id: userId,
				updated_at: new Date().toISOString()
			};

			if (editingAddress) {
				// Update existing address
				const { error } = await supabase
					.from("addresses")
					.update(addressData)
					.eq("id", editingAddress.id);
				
				if (error) throw error;
			} else {
				// Create new address
				addressData.created_at = new Date().toISOString();
				
				const { data, error } = await supabase
					.from("addresses")
					.insert([addressData])
					.select()
					.single();
				
				if (error) throw error;
				
				// Auto-select newly created address
				setSelectedAddressId(data.id);
			}

			// Reset form and fetch updated addresses
			setFormData({
				full_name: "",
				phone: "",
				street: "",
				city: "",
				state: "",
				postal_code: "",
				address_type: "home"
			});
			setShowAddForm(false);
			setEditingAddress(null);
			await fetchAddresses();
			
		} catch (error) {
			console.error("Error saving address:", error);
			alert("Error saving address: " + error.message);
		} finally {
			setLoading(false);
		}
	};

	const handleEdit = (address) => {
		setFormData({
			full_name: address.full_name || "",
			phone: address.phone || "",
			street: address.street || "",
			city: address.city || "",
			state: address.state || "",
			postal_code: address.postal_code || "",
			address_type: address.address_type || "home"
		});
		setEditingAddress(address);
		setShowAddForm(true);
	};

	const handleDelete = async (addressId) => {
		if (!confirm("Are you sure you want to delete this address?")) return;
		
		try {
			setLoading(true);
			const { error } = await supabase
				.from("addresses")
				.delete()
				.eq("id", addressId);
			
			if (error) throw error;
			
			// If deleted address was selected, select another one
			if (selectedAddressId === addressId) {
				const remainingAddresses = addresses.filter(addr => addr.id !== addressId);
				setSelectedAddressId(remainingAddresses.length > 0 ? remainingAddresses[0].id : null);
			}
			
			await fetchAddresses();
		} catch (error) {
			console.error("Error deleting address:", error);
			alert("Error deleting address: " + error.message);
		} finally {
			setLoading(false);
		}
	};

	const resetForm = () => {
		setFormData({
			full_name: "",
			phone: "",
			street: "",
			city: "",
			state: "",
			postal_code: "",
			address_type: "home"
		});
		setEditingAddress(null);
		setShowAddForm(false);
	};

	if (loading && addresses.length === 0) {
		return (
			<div className="flex items-center justify-center py-12">
				<div className="text-center">
					<div className="w-12 h-12 mx-auto mb-4 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
					<p className="text-gray-600">Loading addresses...</p>
				</div>
			</div>
		);
	}

	return (
		<div className="space-y-6">
			{/* Existing Addresses */}
			{addresses.length > 0 && (
				<div className="space-y-4">
					<h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
						<span>📍</span>
						Select Delivery Address
					</h3>
					
					<div className="space-y-3 max-h-80 overflow-y-auto pr-2">
						{addresses.map((address) => (
							<div
								key={address.id}
								className={`relative p-4 rounded-xl border-2 cursor-pointer transition-all duration-300 hover:shadow-md ${
									selectedAddressId === address.id
										? "border-indigo-500 bg-indigo-50 shadow-md"
										: "border-gray-200 bg-gray-50 hover:border-gray-300"
								}`}
								onClick={() => setSelectedAddressId(address.id)}
							>
								{/* Selection Radio */}
								<div className="absolute top-4 right-4">
									<div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
										selectedAddressId === address.id
											? "border-indigo-500 bg-indigo-500"
											: "border-gray-300"
									}`}>
										{selectedAddressId === address.id && (
											<div className="w-2 h-2 bg-white rounded-full"></div>
										)}
									</div>
								</div>

								{/* Address Content */}
								<div className="pr-8">
									<div className="flex items-center gap-2 mb-2">
										<span className="text-sm font-medium text-indigo-600 bg-indigo-100 px-2 py-1 rounded-full">
											{address.address_type?.charAt(0).toUpperCase() + address.address_type?.slice(1) || 'Home'}
										</span>
									</div>
									
									<h4 className="font-semibold text-gray-900 mb-1">
										{address.full_name}
									</h4>
									
									<p className="text-gray-600 text-sm mb-2">
										{address.street}
									</p>
									
									<p className="text-gray-600 text-sm mb-2">
										{address.city}, {address.state} {address.postal_code}
									</p>
									
									<p className="text-gray-500 text-sm">
										📞 {address.phone}
									</p>
								</div>

								{/* Action Buttons */}
								<div className="flex gap-2 mt-3">
									<button
										onClick={(e) => {
											e.stopPropagation();
											handleEdit(address);
										}}
										className="text-xs bg-blue-100 text-blue-600 px-3 py-1 rounded-lg hover:bg-blue-200 transition-colors"
									>
										Edit
									</button>
									<button
										onClick={(e) => {
											e.stopPropagation();
											handleDelete(address.id);
										}}
										className="text-xs bg-red-100 text-red-600 px-3 py-1 rounded-lg hover:bg-red-200 transition-colors"
									>
										Delete
									</button>
								</div>
							</div>
						))}
					</div>
				</div>
			)}

			{/* Add New Address Button */}
			{!showAddForm && (
				<button
					onClick={() => setShowAddForm(true)}
					className="w-full py-4 border-2 border-dashed border-gray-300 rounded-xl text-gray-600 hover:border-indigo-400 hover:text-indigo-600 hover:bg-indigo-50 transition-all duration-300 flex items-center justify-center gap-2"
				>
					<span className="text-xl">➕</span>
					<span className="font-medium">Add New Address</span>
				</button>
			)}

			{/* Add/Edit Address Form */}
			{showAddForm && (
				<div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
					<div className="flex items-center justify-between mb-6">
						<h3 className="text-lg font-semibold text-gray-800">
							{editingAddress ? "Edit Address" : "Add New Address"}
						</h3>
						<button
							onClick={resetForm}
							className="text-gray-500 hover:text-gray-700 p-1"
						>
							✕
						</button>
					</div>

					<form onSubmit={handleSubmit} className="space-y-4">
						{/* Name and Phone Row */}
						<div className="grid md:grid-cols-2 gap-4">
							<div>
								<label className="block text-sm font-medium text-gray-700 mb-2">
									Full Name *
								</label>
								<input
									type="text"
									required
									value={formData.full_name}
									onChange={(e) => setFormData({...formData, full_name: e.target.value})}
									className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
									placeholder="Enter full name"
								/>
							</div>
							<div>
								<label className="block text-sm font-medium text-gray-700 mb-2">
									Phone Number *
								</label>
								<input
									type="tel"
									required
									value={formData.phone}
									onChange={(e) => setFormData({...formData, phone: e.target.value})}
									className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
									placeholder="Enter phone number"
								/>
							</div>
						</div>

						{/* Street Address */}
						<div>
							<label className="block text-sm font-medium text-gray-700 mb-2">
								Street Address *
							</label>
							<textarea
								required
								value={formData.street}
								onChange={(e) => setFormData({...formData, street: e.target.value})}
								className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors resize-none"
								rows="3"
								placeholder="Enter complete address"
							/>
						</div>

						{/* City, State, Postal Code Row */}
						<div className="grid md:grid-cols-3 gap-4">
							<div>
								<label className="block text-sm font-medium text-gray-700 mb-2">
									City *
								</label>
								<input
									type="text"
									required
									value={formData.city}
									onChange={(e) => setFormData({...formData, city: e.target.value})}
									className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
									placeholder="City"
								/>
							</div>
							<div>
								<label className="block text-sm font-medium text-gray-700 mb-2">
									State *
								</label>
								<input
									type="text"
									required
									value={formData.state}
									onChange={(e) => setFormData({...formData, state: e.target.value})}
									className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
									placeholder="State"
								/>
							</div>
							<div>
								<label className="block text-sm font-medium text-gray-700 mb-2">
									Postal Code *
								</label>
								<input
									type="text"
									required
									value={formData.postal_code}
									onChange={(e) => setFormData({...formData, postal_code: e.target.value})}
									className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
									placeholder="Postal Code"
								/>
							</div>
						</div>

						{/* Address Type */}
						<div>
							<label className="block text-sm font-medium text-gray-700 mb-2">
								Address Type
							</label>
							<div className="grid grid-cols-3 gap-3">
								{["home", "office", "other"].map((type) => (
									<button
										key={type}
										type="button"
										onClick={() => setFormData({...formData, address_type: type})}
										className={`py-2 px-4 rounded-lg border-2 transition-all duration-200 ${
											formData.address_type === type
												? "border-indigo-500 bg-indigo-50 text-indigo-700"
												: "border-gray-300 text-gray-600 hover:border-gray-400"
										}`}
									>
										{type.charAt(0).toUpperCase() + type.slice(1)}
									</button>
								))}
							</div>
						</div>

						{/* Form Actions */}
						<div className="flex gap-3 pt-4">
							<button
								type="button"
								onClick={resetForm}
								className="flex-1 bg-gray-100 text-gray-700 py-3 px-6 rounded-lg font-medium hover:bg-gray-200 transition-colors"
							>
								Cancel
							</button>
							<button
								type="submit"
								disabled={loading}
								className="flex-1 bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-3 px-6 rounded-lg font-medium hover:from-indigo-700 hover:to-purple-700 disabled:opacity-50 transition-all duration-300"
							>
								{loading ? "Saving..." : editingAddress ? "Update Address" : "Add Address"}
							</button>
						</div>
					</form>
				</div>
			)}

			{/* No Address Message */}
			{addresses.length === 0 && !showAddForm && (
				<div className="text-center py-8">
					<div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center">
						<span className="text-2xl">📍</span>
					</div>
					<h3 className="text-lg font-semibold text-gray-800 mb-2">No Addresses Found</h3>
					<p className="text-gray-600 mb-4">Add your first delivery address to continue</p>
				</div>
			)}
		</div>
	);
};

export default AddressSection;