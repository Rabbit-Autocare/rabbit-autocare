import { NextResponse } from 'next/server';

// Define our fixed categories
export async function GET() {
  try {
    const categories = ['Interior', 'Exterior', 'Engine Parts', 'Maintenance'];

    return NextResponse.json({ categories });
  } catch (error) {
    console.error('Error fetching categories:', error);
    return NextResponse.json(
      { error: 'Failed to fetch categories' },
      { status: 500 }
    );
  }
}
