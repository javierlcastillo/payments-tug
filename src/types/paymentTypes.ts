export interface PaymentRequest {
    amount: number;
    currency: string;
    customerId: string;
    destinationAccountId: string;
    applicationFeeAmount: number;
    appId: string;
    eventId: string;
    userId: string;
    ticketTypeId: string;
    quantity: number;
    paymentMethodId?: string;
}

export interface PaymentResponse {
    clientSecret: string | null;
    paymentIntentId: string;
    platformFee: number;
}

export interface PaymentStatusResponse {
    id: string;
    status: "succeeded" | "processing" | "requires_payment_method" | "requires_confirmation" | "canceled";
    amount: number;
    currency: string;
}

export interface CheckoutSessionRequest {
    amount: number;
    currency: string;
    customerId: string;
    destinationAccountId: string;
    applicationFeeAmount: number;
    appId: string;
    eventId: string;
    userId: string;
    ticketTypeId: string;
    quantity: number;
    returnUrl: string;
}

export interface CheckoutSessionResponse {
    clientSecret: string | null;
    sessionId: string;
    paymentIntentId: string | null;
    platformFee: number;
}
