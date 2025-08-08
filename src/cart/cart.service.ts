import { Inject, Injectable, NotFoundException, InternalServerErrorException, BadRequestException } from "@nestjs/common";
import { Model, Types } from "mongoose";
import { Cart, CartItem } from "./interfaces/cart.interface";
import { ResponseShape } from "src/interfaces/response.interface";

@Injectable()
export class CartService {
  constructor(@Inject('CART_MODEL') private CartModel: Model<Cart>) {}

  /**
   * Create a new cart for a user
   * @param userId - The ID of the user
   * @param cartItem - The initial cart item
   * @returns The created cart
   */
  async createCart(userId: string, cartItem: CartItem): Promise<ResponseShape> {
    try {
      // Check if user already has a cart
      const existingCart = await this.CartModel.findOne({ userId: new Types.ObjectId(userId) });
      
      if (existingCart) {
        return {
          success: false,
          message: 'User already has a cart',
          data: existingCart
        };
      }

      // Calculate total for the item
      const itemTotal = cartItem.price * cartItem.quantity;
      
      // Create a new cart
      const newCart = await this.CartModel.create({
        userId: new Types.ObjectId(userId),
        items: [{
          ...cartItem,
          productId: new Types.ObjectId(cartItem.productId),
          total: itemTotal
        }],
        totalPrice: itemTotal
      });

      return {
        success: true,
        message: 'Cart created successfully',
        data: newCart
      };
    } catch (error) {
      throw new InternalServerErrorException(`Failed to create cart: ${error.message}`);
    }
  }

  /**
   * Get a user's cart
   * @param userId - The ID of the user
   * @returns The user's cart
   */
  async getCartByUserId(userId: string): Promise<ResponseShape> {
    try {
      const cart = await this.CartModel.findOne({ userId: new Types.ObjectId(userId) })
        .populate('items.productId', 'name price images')
        .exec();

      if (!cart) {
        return {
          success: false,
          message: 'Cart not found',
          data: null
        };
      }

      return {
        success: true,
        message: 'Cart retrieved successfully',
        data: cart
      };
    } catch (error) {
      throw new InternalServerErrorException(`Failed to get cart: ${error.message}`);
    }
  }

  /**
   * Add an item to the cart
   * @param userId - The ID of the user
   * @param cartItem - The item to add
   * @returns The updated cart
   */
  async addItemToCart(userId: string, cartItem: CartItem): Promise<ResponseShape> {
    try {
      // Find the user's cart
      let cart = await this.CartModel.findOne({ userId: new Types.ObjectId(userId) });
      
      // If cart doesn't exist, create a new one
      if (!cart) {
        return this.createCart(userId, cartItem);
      }

      // Check if the product already exists in the cart
      const existingItemIndex = cart.items.findIndex(
        item => item.productId.toString() === cartItem.productId.toString()
      );

      if (existingItemIndex > -1) {
        // ✅ المنتج موجود بالفعل في السلة
        // ❌ مش هنزود الكمية
        return {
          success: false,
          message: 'Item already exists in cart',
          data: cart
        }} else {
        // Add the new item to the cart
        const itemTotal = cartItem.price * cartItem.quantity;
        cart.items.push({
          ...cartItem,
          productId: new Types.ObjectId(cartItem.productId),
          total: itemTotal
        });
      }

      // Recalculate the total price of the cart
      cart.totalPrice = cart.items.reduce((sum, item) => sum + item.total, 0);
      
      // Save the updated cart
      await cart.save();

      return {
        success: true,
        message: 'Item added to cart successfully',
        data: cart
      };
    } catch (error) {
      throw new InternalServerErrorException(`Failed to add item to cart: ${error.message}`);
    }
  }

  /**
   * Update the quantity of an item in the cart
   * @param userId - The ID of the user
   * @param productId - The ID of the product
   * @param quantity - The new quantity
   * @returns The updated cart
   */
  async updateCartItemQuantity(
    userId: string, 
    productId: string, 
    quantity: number
  ): Promise<ResponseShape> {
    try {
      if (quantity < 1) {
        throw new BadRequestException('Quantity must be at least 1');
      }

      // Find the user's cart
      const cart = await this.CartModel.findOne({ userId: new Types.ObjectId(userId) });
      
      if (!cart) {
        throw new NotFoundException('Cart not found');
      }

      // Find the item in the cart
      const itemIndex = cart.items.findIndex(
        item => item.productId.toString() === productId
      );

      if (itemIndex === -1) {
        throw new NotFoundException('Item not found in cart');
      }

      // Update the quantity and total of the item
      cart.items[itemIndex].quantity = quantity;
      cart.items[itemIndex].total = cart.items[itemIndex].price * quantity;
      
      // Recalculate the total price of the cart
      cart.totalPrice = cart.items.reduce((sum, item) => sum + item.total, 0);
      
      // Save the updated cart
      await cart.save();

      return {
        success: true,
        message: 'Cart item quantity updated successfully',
        data: cart
      };
    } catch (error) {
      if (error instanceof BadRequestException || error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException(`Failed to update cart item: ${error.message}`);
    }
  }

  /**
   * Remove an item from the cart
   * @param userId - The ID of the user
   * @param productId - The ID of the product to remove
   * @returns The updated cart
   */
  async removeItemFromCart(userId: string, productId: string): Promise<ResponseShape> {
    try {
      // Find the user's cart
      const cart = await this.CartModel.findOne({ userId: new Types.ObjectId(userId) });
      
      if (!cart) {
        throw new NotFoundException('Cart not found');
      }

      // Find the item in the cart
      const itemIndex = cart.items.findIndex(
        item => item.productId.toString() === productId
      );

      if (itemIndex === -1) {
        throw new NotFoundException('Item not found in cart');
      }

      // Remove the item from the cart
      cart.items.splice(itemIndex, 1);
      
      // If cart is empty after removing the item, delete the cart
      if (cart.items.length === 0) {
        await this.CartModel.findByIdAndDelete(cart._id);
        return {
          success: true,
          message: 'Item removed and cart deleted as it became empty',
          data: null
        };
      }
      
      // Recalculate the total price of the cart
      cart.totalPrice = cart.items.reduce((sum, item) => sum + item.total, 0);
      
      // Save the updated cart
      await cart.save();

      return {
        success: true,
        message: 'Item removed from cart successfully',
        data: cart
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException(`Failed to remove item from cart: ${error.message}`);
    }
  }

  /**
   * Clear all items from a user's cart
   * @param userId - The ID of the user
   * @returns Success message
   */
  async clearCart(userId: string): Promise<ResponseShape> {
    try {
      const result = await this.CartModel.findOneAndDelete({ 
        userId: new Types.ObjectId(userId) 
      });
      
      if (!result) {
        return {
          success: false,
          message: 'Cart not found',
          data: null
        };
      }

      return {
        success: true,
        message: 'Cart cleared successfully',
        data: null
      };
    } catch (error) {
      throw new InternalServerErrorException(`Failed to clear cart: ${error.message}`);
    }
  }
}
