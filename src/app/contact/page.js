import React from "react";

export default function ContactPage() {
	return (
		<div className="max-w-7xl mx-auto px-4 py-8">
			<h1 className="text-3xl font-bold mb-6">Get In Touch</h1>
			<div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
				<div className="bg-white shadow-md rounded-lg p-6">
					<h2 className="text-xl font-semibold mb-4">Send Us a Message</h2>
					<form className="space-y-4">
						<div>
							<label className="block mb-1">Name</label>
							<input
								type="text"
								className="w-full border rounded p-2"
								placeholder="Your name"
							/>
						</div>
						<div>
							<label className="block mb-1">Email</label>
							<input
								type="email"
								className="w-full border rounded p-2"
								placeholder="Your email"
							/>
						</div>
						<div>
							<label className="block mb-1">Message</label>
							<textarea
								className="w-full border rounded p-2 h-32"
								placeholder="Your message"
							></textarea>
						</div>
						<button
							type="submit"
							className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700"
						>
							Send Message
						</button>
					</form>
				</div>
				<div className="bg-white shadow-md rounded-lg p-6">
					<h2 className="text-xl font-semibold mb-4">Contact Information</h2>
					<div className="space-y-3">
						<p>
							<strong>Address:</strong> 123 Auto Street, Car City, 12345
						</p>
						<p>
							<strong>Phone:</strong> (123) 456-7890
						</p>
						<p>
							<strong>Email:</strong> info@carautocare.com
						</p>
						<p>
							<strong>Hours:</strong> Monday-Friday: 9am-6pm, Saturday: 10am-4pm
						</p>
					</div>
					<div className="mt-6 bg-gray-200 w-full h-64 rounded">
						{/* Google Map would go here */}
						<div className="w-full h-full flex items-center justify-center text-gray-500">
							Google Map Placeholder
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
