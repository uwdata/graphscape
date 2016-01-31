class HomeController < ApplicationController
  def index
    # offset = rand(1323440)
    # offset = rand(24952)
    # offset = rand(388)
    offset = rand(ENV["TRIPLET_COUNT"].to_i) + 1
    # offset = 89335
    p offset
    @triplet = Triplet.find_by_id_in_csv(offset);
    # @triplet = Triplet.order("RANDOM()").first

    @human_answer = HumanAnswer.new()


  end

  def specs

    @specs = Spec.all
    @edges = Edge.all

  end


end
