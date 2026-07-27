import React, { use, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import userLogo from '../assets/User.png'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ShoppingCart, Trash2 } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { setCart } from '@/redux/menuSlice';
import axios from 'axios';
import RHSOrderSummary from '@/components/RHSOrderSummary';

const Cart = () => {
  const { cart } = useSelector(store => store.product)
  const navigate = useNavigate();
  const subTotal = cart?.totalPrice || 0;
  const shipping = subTotal > 299 || subTotal === 0 ? 0 : 10;
  const tax = subTotal * 0.05;
  const total = subTotal + shipping + tax;

  const dispatch = useDispatch();

  const API = "http://localhost:8000/api/v1/cart";
  const accessToken = localStorage.getItem('accessToken');

  const loadCart = async () => {
    try {
      const res = await axios.get(API, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        }
      })
      if (res.data.success) {
        dispatch(setCart(res.data.cart));
      }
    } catch (error) {
      console.log(error);
    }
  }

  useEffect(() => {
    loadCart()
  }, [dispatch])

  const handleUpdateQuantity = async (product_id, type) => {
    try {
      console.log(accessToken)
      const res = await axios.put(`${API}/update`, { product_id, type }, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        }
      })
      if (res.data.success) {
        dispatch(setCart(res.data.cart));
      }
    } catch (error) {
      console.log(error);
    }
  }
  const handleRemove = async (productId) => {
    try {
      const res = await axios.delete(`${API}/remove`, {
        data: { productId },
        headers: {
          Authorization: `Bearer ${accessToken}`,
        }
      })
      if (res.data.success) {
        dispatch(setCart(res.data.cart));
        toast.success('Product removed from cart!');
      }
    } catch (error) {
      console.log(error);
    }
  }

  return (
    <div className='pt-20 bg-gray-50 min-h-screen'>
      {
        cart?.items?.length > 0 ?
          <div className='max-w-7xl mx-auto'>
            <h1 className='text-2xl font-bold text-gray-800 mb-7 mt-5'>Shopping Cart</h1>
            <div className='max-w-7xl mx-auto flex gap-7'>
              <div className='flex flex-col gap-5 flex-1'>
                {cart?.items?.map((product, index) => (
                  <Card key={index}>
                    <div className='flex justify-between pr-7 items-center'>
                      <div className='flex 2-[350px] items-center'>
                        <img className='w-25 h-25' src={product?.productId?.productImg?.[0]?.url || userLogo} alt='' />
                        <div className='w-[280px]'>
                          <h1 className='font-semibold truncate'>{product?.productId?.productName}</h1>
                          <p>₹{product?.productId?.productPrice}</p>
                        </div>
                      </div>
                      <div className='flex gap-5 items-center'>
                        <Button
                          variant='outline'
                          onClick={() => handleUpdateQuantity(product.productId._id, 'decrease')}
                        >-</Button>
                        <span>{product?.quantity}</span>
                        <Button
                          variant='outline'
                          onClick={() => handleUpdateQuantity(product.productId._id, 'increase')}
                        >+</Button>
                      </div>
                      <p>₹{(product?.productId?.productPrice) * (product?.quantity)}</p>
                      <p
                        onClick={() => handleRemove(product?.productId?._id)}
                        className='flex text-red-500 items-center gap-1 cursor-pointer'><Trash2 className='w-4 h-4' />Remove</p>
                    </div>
                  </Card>
                ))}
              </div>

              {/* RHS Order Summary */}
              <div>
                <Card className='w-[400px]'>
                  <CardHeader>
                    <CardTitle>Order Summary</CardTitle>
                  </CardHeader>
                  <CardContent className='space-y-4'>
                    {/* Subtotal */}
                    <div className='flex justify-between'>
                      <span>Subtotal ({cart?.items?.length || 0} items)</span>
                      <span>₹{subTotal.toLocaleString('en-IN')}</span>
                    </div>

                    {/* Shipping */}
                    <div className='flex justify-between'>
                      <span>Shipping</span>
                      <span>{shipping === 0 ? "FREE" : `₹${shipping}`}</span>
                    </div>

                    {/* Tax */}
                    <div className='flex justify-between'>
                      <span>Tax (5%)</span>
                      <span>₹{tax.toLocaleString('en-IN')}</span>
                    </div>
                    <Separator />

                    {/* Total */}
                    <div className='flex justify-between font-bold text-lg'>
                      <span>Total</span>
                      <span>₹{total.toLocaleString('en-IN')}</span>
                    </div>

                    <div className='space-y-3 pt-4'>
                      <div className='flex space-x-2'>
                        <Input placeholder='Promo Code' />
                        <Button variant='outline'>Apply</Button>
                      </div>

                      {/* asChild avoids nesting button inside anchor element */}
                      <Button className='w-full bg-pink-600 hover:bg-pink-700 cursor-pointer text-white' asChild>
                        <Link to="/address">PLACE ORDER</Link>
                      </Button>

                      <Button variant='outline' className='w-full bg-transparent cursor-pointer' asChild>
                        <Link to="/products">CONTINUE SHOPPING</Link>
                      </Button>
                    </div>

                    <div className='text-sm text-muted-foreground pt-4'>
                      <p>* Free shipping on orders above 299</p>
                      <p>* 30-day return policy</p>
                      <p>* Secure checkout with SSL encryption</p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div> :
          <div className='flex flex-col items-center justify-center min-h-[60vh] p-6 text-center'>
            {/* Icon */}
            <div className='bg-pink-100 p-6 rounded-full'>
              <ShoppingCart className='w-16 h-16 text-pink-600' />
            </div>

            {/* title */}
            <h2 className='mt-6 text-2xl font-bold text-gray-800'>Your Cart is Empty</h2>
            <p>Looks like you haven't added anything to your Cart yet</p>
            <Button className='mt-6 bg-pink-600 cursor-pointer text-white hover:bg-pink-700'>
              <Link to="/products">START SHOPPING</Link>
            </Button>
          </div>
      }
    </div>
  )
}

export default Cart