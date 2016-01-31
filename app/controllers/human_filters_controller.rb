class HumanFiltersController < ApplicationController
  def index


    @specs = Spec.all
    # @spec = Spec.last
    # @human_filter = HumanFilter.new
  end

  def show
    @spec = Spec.find_by_id(params[:id])
    @human_filter = HumanFilter.new
  end

  def create
    @human_filter = HumanFilter.new(human_filter_params);
    if @human_filter.save
      offset = rand(Spec.count) + 1
      @spec = Spec.find_by_id(offset);

      redirect_to human_filter_path(@spec)
    else
      raise '!';
    end
  end

private
  def human_filter_params
    params.require(:human_filter).permit(:answer, :spec_id)
  end
end
