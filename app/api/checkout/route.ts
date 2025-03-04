import { NextResponse } from "next/server";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string);

interface CartItem {
  id: string;
  priceId: string;
  quantity: number;
}

interface CheckoutRequest {
  items: CartItem[];
  userId: string;
}

export async function POST(req: Request) {
  try {
    const { items, userId }: CheckoutRequest = await req.json();

    if (!items || !items.length) {
      return NextResponse.json({ error: "Cart is empty" }, { status: 400 });
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "payment",
      line_items: items.map((item: CartItem) => ({
        price: item.priceId,
        quantity: item.quantity,
      })),
      success_url: `https://ui-app.com/success?session_id={CHECKOUT_SESSION_ID}`,
      apiVersion: '2025-01-27.acacia',
      cancel_url: `https://ui-app.com/cart`,
      metadata: {
        user_id: userId,
        product_ids: items.map((item: CartItem) => item.id).join(","),
      },
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error("Checkout API error:", error);
    return NextResponse.json({ error: "Failed to create checkout session" }, { status: 500 });
  }
}
