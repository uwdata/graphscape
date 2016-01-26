class EmbedmentsController < ApplicationController
  before_action :get_embedment, except: [:index, :create, :new]

  def index
    @embedments = Embedment.all
  end
  def show
    specs_with_coordinates = @embedment.specs_with_coordinates

    @coordinates = specs_with_coordinates[:coordinates]
    @specs = specs_with_coordinates[:specs]
  end
  def new
    @embedment = Embedment.new()
  end

  def create

    @embedment = Embedment.new(embedment_params)

    if @embedment.save
      flash[:success] = "Embedment has been saved successfully."
    else
      flash[:error] = "Failed to create a new embedment."
    end

    redirect_to embedments_path()
  end

  def edit

  end

  def update

    if @embedment.update(embedment_params)
      flash[:success] = "Embedment has been saved successfully."
    else
      flash[:error] = "Failed to update the embedment."
    end

    redirect_to embedments_path()
  end

  def destroy
    if @embedment.destroy
      flash[:success] = "Embedment has been destroyed."
    else
      flash[:error] = "Failed to destory the embedment."
    end

    redirect_to embedments_path()
  end

private
  def embedment_params
    params.require(:embedment).permit(:title, :filename)
  end

  def get_embedment
    @embedment = Embedment.find(params[:id])
  end
end
