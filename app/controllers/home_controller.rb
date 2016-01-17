class HomeController < ApplicationController
  def index
    # offset = rand(1323440)
    # offset = rand(24952)
    offset = rand(388)
    @triplet = Triplet.find(offset);
    # @triplet = Triplet.order("RANDOM()").first

    @human_answer = HumanAnswer.new()


  end

  def embedded
    @spec_coordinates = SpecCoordinate.all
    @specs = Spec.all

  end

  def making_rule
    @specs = Spec.all

  end
end
