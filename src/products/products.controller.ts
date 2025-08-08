import { 
  Body, 
  Controller, 
  Delete, 
  Get, 
  HttpException, 
  HttpStatus, 
  Param, 
  Patch, 
  Post, 
  Query, 
  UseGuards,
  UseInterceptors,
  UploadedFiles
} from "@nestjs/common";
import { FilesInterceptor } from "@nestjs/platform-express";
import { multerMemoryConfig } from "src/common/config/multer.config";
import { ProductsService } from "./products.service";
import { ResponseShape } from "src/interfaces/response.interface";
import { RolesDecorator } from "src/guards/roles.decorator";
import { UsersGuard } from "src/guards/authentization.guard";
import { CreateProductDto } from "./dto/create.product.dto";
import { UpdateProductDto } from "./dto/update.product.dto";

@Controller('products')
export class ProductsController{
  constructor(private readonly ProductsService:ProductsService){}
// @RolesDecorator(['admin' , 'user'])
  // @UseGuards(UsersGuard)
  @Get()
  getUsers(
    @Query('page') page = 1,
    @Query('limit') limit = 10,
  ): Promise<ResponseShape> {
    try {
      return this.ProductsService.findAll(page, limit);
    } catch (error) {
      throw new HttpException(error, HttpStatus.BAD_REQUEST);
    }
  }
  // @RolesDecorator(['admin','user'])
  // @UseGuards(UsersGuard)
  @Get(':id')
  getUser(@Param('id') id: string): Promise<ResponseShape> {
    try {
      return this.ProductsService.getProduct(id);
    } catch (error) {
      throw new HttpException(error, HttpStatus.BAD_REQUEST);
    }
  }

  @RolesDecorator(['admin'])
  @UseGuards(UsersGuard)
  @Post()
  @UseInterceptors(FilesInterceptor('images', 10, multerMemoryConfig))
  async create(
    @Body() body: CreateProductDto,
    @UploadedFiles() files: Express.Multer.File[]
  ): Promise<ResponseShape> {
    try {
      return await this.ProductsService.createProduct(body, files);
    } catch (error) {
      // Provide more specific error message
      const errorMessage = error.message || 'Failed to create product';
      throw new HttpException(
        {
          message: errorMessage,
          error: error.name || 'Bad Request',
          statusCode: HttpStatus.BAD_REQUEST,
        },
        HttpStatus.BAD_REQUEST,
      );
    }
  }
  @RolesDecorator(['admin'])
  @UseGuards(UsersGuard)
  @Patch(':id')
  @UseInterceptors(FilesInterceptor('images', 10, multerMemoryConfig))
  async updateUser(
    @Body() body: UpdateProductDto,
    @Param('id') id: string,
    @UploadedFiles() files: Express.Multer.File[]
  ): Promise<ResponseShape> {
    try {
      return await this.ProductsService.updateProduct(id, body, files);
    } catch (error) {
      // Provide more specific error message
      const errorMessage = error.message || 'Failed to update product';
      throw new HttpException(
        {
          message: errorMessage,
          error: error.name || 'Bad Request',
          statusCode: HttpStatus.BAD_REQUEST,
        },
        HttpStatus.BAD_REQUEST,
      );
    }
  }
  @RolesDecorator(['admin'])
  @UseGuards(UsersGuard)
  @Delete(':id')
  async deleteUser(
    @Param('id') id: string,
  ): Promise<ResponseShape> {
    try {
      return await this.ProductsService.deleteProduct(id);
    } catch (error) {
      // Provide more specific error message
      const errorMessage = error.message || 'Failed to delete product';
      throw new HttpException(
        {
          message: errorMessage,
          error: error.name || 'Bad Request',
          statusCode: HttpStatus.BAD_REQUEST,
        },
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  // Test endpoint for uploading images directly
  @RolesDecorator(['admin'])
  @UseGuards(UsersGuard)
  @Post('upload-images')
  @UseInterceptors(FilesInterceptor('images', 10, multerMemoryConfig))
  async uploadImages(
    @UploadedFiles() files: Express.Multer.File[]
  ): Promise<ResponseShape> {
    try {
      const imageUrls = await this.ProductsService.uploadProductImages(files);
      return {
        data: { imageUrls },
        message: 'Images uploaded successfully',
        success: true,
      };
    } catch (error) {
      const errorMessage = error.message || 'Failed to upload images';
      throw new HttpException(
        {
          message: errorMessage,
          error: error.name || 'Bad Request',
          statusCode: HttpStatus.BAD_REQUEST,
        },
        HttpStatus.BAD_REQUEST,
      );
    }
  }
}
