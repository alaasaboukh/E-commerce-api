import { Body, Controller, Delete, Get, HttpException, HttpStatus, Param, Patch, Post, Query, UseGuards } from "@nestjs/common";
import { ResponseShape } from "src/interfaces/response.interface";
import { CategoriesService } from "./categories.service";
import { RolesDecorator } from "src/guards/roles.decorator";
import { UsersGuard } from "src/guards/authentization.guard";
import { updateCategoryDto } from "./dto/update.category.dto";
import { CreateCategoryDto } from "./dto/create.category.dto";

@Controller('categories')
export class CategoriesController{
  constructor(private readonly CategoriesService:CategoriesService){}

  // @RolesDecorator(['admin' , 'user'])
    // @UseGuards(UsersGuard)
    @Get()
    getUsers(
      @Query('page') page = 1,
      @Query('limit') limit = 10,
    ): Promise<ResponseShape> {
      try {
        return this.CategoriesService.getAllCategories(page, limit);
      } catch (error) {
        throw new HttpException(error, HttpStatus.BAD_REQUEST);
      }
    }
    @RolesDecorator(['admin','user'])
    @UseGuards(UsersGuard)
    @Get(':id')
    getUser(@Param('id') id: string): Promise<ResponseShape> {
      try {
        return this.CategoriesService.getCategory(id);
      } catch (error) {
        throw new HttpException(error, HttpStatus.BAD_REQUEST);
      }
    }
  
    @RolesDecorator(['admin'])
    @UseGuards(UsersGuard)
    @Post()
    async create(@Body() body: CreateCategoryDto): Promise<ResponseShape> {
      try {
        return await this.CategoriesService.createCategory(body);
      } catch (error) {
        // Provide more specific error message
        const errorMessage = error.message || 'Failed to create category';
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
    async updateUser(
      @Body() body: updateCategoryDto,
      @Param('id') id: string,
    ): Promise<ResponseShape> {
      try {
        return await this.CategoriesService.updateCategory(id, body);
      } catch (error) {
        // Provide more specific error message
        const errorMessage = error.message || 'Failed to update category';
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
        return await this.CategoriesService.deleteCategory(id);
      } catch (error) {
        // Provide more specific error message
        const errorMessage = error.message || 'Failed to delete category';
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