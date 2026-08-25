import { Request, Response } from 'express';
import Stripe from 'stripe';
import { PaymentRequest, CheckoutSessionRequest } from '../types/paymentTypes';

const getStripe = () => new Stripe(process.env.STRIPE_SECRET_KEY as string);

// create a payment
export const createPayment = async (req: Request, res: Response): Promise<void> => {
  const { amount, currency, customerId, destinationAccountId, applicationFeeAmount, appId, eventId, userId, ticketTypeId, quantity, paymentMethodId } = req.body as PaymentRequest;

  if (!amount || amount <= 0 || !currency || !customerId || !destinationAccountId || !appId || !eventId || !userId || !ticketTypeId || !quantity || quantity <= 0) {
    res.status(400).json({ error: 'Missing required fields' });
    return;
  }

  if (
    applicationFeeAmount === undefined ||
    applicationFeeAmount === null ||
    !Number.isFinite(applicationFeeAmount) ||
    applicationFeeAmount < 0 ||
    applicationFeeAmount > amount
  ) {
    res.status(400).json({ error: 'Invalid applicationFeeAmount' });
    return;
  }

  const platformFee = Math.round(applicationFeeAmount);

  try {
    const paymentIntent = await getStripe().paymentIntents.create({
        amount,
        currency,
        customer: customerId,
        application_fee_amount: platformFee,
        transfer_data: { destination: destinationAccountId },
        metadata: { appId, eventId, userId, ticketTypeId, quantity: String(quantity) },
        ...(paymentMethodId && {
            payment_method: paymentMethodId,
            confirm: true,
            off_session: true,
        }),
    });

    res.status(201).json({
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
        platformFee,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    res.status(500).json({
        error: 'Failed to create payment',
        ...(process.env.NODE_ENV !== 'production' && { detail: message }),
    });
  }
};

// Controller funcional solo para web ya que no existe flutter payment sheet en web.
export const createCheckoutSession = async (req: Request, res: Response): Promise<void> => {
  const { amount, currency, customerId, destinationAccountId, applicationFeeAmount, appId, eventId, userId, ticketTypeId, quantity, returnUrl } = req.body as CheckoutSessionRequest;

  if (!amount || amount <= 0 || !currency || !customerId || !destinationAccountId || !appId || !eventId || !userId || !ticketTypeId || !quantity || quantity <= 0 || !returnUrl) {
    res.status(400).json({ error: 'Missing required fields' });
    return;
  }

  if (
    applicationFeeAmount === undefined ||
    applicationFeeAmount === null ||
    !Number.isFinite(applicationFeeAmount) ||
    applicationFeeAmount < 0 ||
    applicationFeeAmount > amount
  ) {
    res.status(400).json({ error: 'Invalid applicationFeeAmount' });
    return;
  }

  const platformFee = Math.round(applicationFeeAmount);

  try {
    const session = await getStripe().checkout.sessions.create({
        ui_mode: 'embedded_page',
        mode: 'payment',
        customer: customerId,
        return_url: returnUrl,
        line_items: [{
            price_data: {
                currency,
                unit_amount: amount,
                product_data: { name: 'Event ticket' },
            },
            quantity: 1,
        }],
        payment_intent_data: {
            application_fee_amount: platformFee,
            transfer_data: { destination: destinationAccountId },
            metadata: { appId, eventId, userId, ticketTypeId, quantity: String(quantity) },
        },
        metadata: { appId, eventId, userId, ticketTypeId, quantity: String(quantity) },
    });

    res.status(201).json({
        clientSecret: session.client_secret,
        sessionId: session.id,
        platformFee,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    res.status(500).json({
        error: 'Failed to create checkout session',
        ...(process.env.NODE_ENV !== 'production' && { detail: message }),
    });
  }
};

export const getPaymentStatus = async (req: Request, res: Response): Promise<void> => {
  const id = req.params.id as string;

  try {
    const intent = await getStripe().paymentIntents.retrieve(id);
    res.status(200).json({
        id: intent.id,
        status: intent.status,
        amount: intent.amount,
        currency: intent.currency,
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve payment' });
  }
};
