This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://github.com/vercel/next.js/tree/canary/packages/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.js`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details. 

createtable public.kits (

  id uuid notnulldefault extensions.uuid_generate_v4 (),

  name textnotnull,

  description textnull,

  image_url textnull,

  original_price numeric(10,2)notnulldefault0,

  price numeric(10,2)notnulldefault0,

  discount_percent numeric(5,2)nulldefault0,

  inventory integer nulldefault1,

  created_at timestamp with time zone nulldefaultnow(),

  updated_at timestamp with time zone nulldefaultnow(),

  main_image_url textnull,

  images jsonb nulldefault'[]'::jsonb,

  variant_count integer nulldefault0,

  constraint kits_pkey primary key (id)

) TABLESPACE pg_default;

create trigger trg_enforce_kit_variant_minimum BEFORE

update on kits for EACH row

execute FUNCTION enforce_minimum_kit_items ();

create trigger update_kits_timestamp BEFORE

update on kits for EACH row

execute FUNCTION update_timestamp ();
