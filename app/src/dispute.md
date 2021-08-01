## Order Dispute

In the order, in case of issue like package destroyed, lost or a scam from any actor, it's possible to create a dispute.
The goal of the issue is to found an agreement between actor before the time delay is reached. If the delay is reached
before the dispute validated, locked founds will be lost.

### Buyer refunds

The first stage is to determine the amount the buyer will receive. It can't be more than
> Seller price + Delivery price

When the amount is validated, the result and the buyer escrow can be withdrawn. Even if the amount determined is 0, the
value of the escrow is retrieved by the buyer.

### Cost repartition

After the buyer out of the dispute, then the cost repartition need to be determined between the delivery man and the
seller. It could be like the seller didn't sell what it was defined or if the package is damaged/destroyed during the
delivery. Or also if the delivery steal the package. The function use a parameter, sellerBalance is a signed number to
determine which actor will pay. Here is the math

For the seller :
> Seller price + Seller escrow + Seller balance - (Buyer receive / 2)

For the delivery :
> Delivery price + Delivery escrow - Seller balance - (Buyer receive / 2)

If the result of the math is negative, the actor need to pay the difference.
So when the seller balance is positive, the cost need to be handled by the seller.
