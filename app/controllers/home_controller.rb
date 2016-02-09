class HomeController < ApplicationController
  def index
    # offset = rand(1323440)
    # offset = rand(24952)
    # offset = rand(388)
    @offset = rand(ENV["TRIPLET_COUNT"].to_i) + 1
    # offset = 89335
    @user_covered = current_user.human_answers.where("created_at >= ?", (Time.now-24.hours)).where("answer <> ?", "hard").count
    @daily_goal = 2

    @total = ENV["TRIPLET_COUNT"].to_i
    @covered = HumanAnswer.where("answer <> ?", "hard").pluck(:triplet_id).uniq.count
    @triplet = Triplet.find_by_id(@offset) || Triplet.find_by_id_in_csv(@offset)
    # @triplet = Triplet.order("RANDOM()").first

    @human_answer = HumanAnswer.new()


  end

  def specs

    @specs = Spec.all
    @edges = Edge.all

  end


end
