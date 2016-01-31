class HumanAnswersController < ApplicationController
  def index
    @wrong_answers = HumanAnswer.joins(:triplet).where("answer = 'left' and compared_result <> 1").all
    @wrong_answers = @wrong_answers + HumanAnswer.joins(:triplet).where("answer = 'right' and compared_result <> -1").all


  end
  def create
    @human_answer = HumanAnswer.new(human_answer_params)
    @human_answer.user = @current_user

    error = false

    if @human_answer.save
      if !Triplet.find_by_id(@human_answer.triplet_id)
        triplet = Triplet.find_by_id_in_csv(@human_answer.triplet_id)
        if !triplet.save
          raise '!';
        end
      end
      redirect_to root_path()
    else
      raise '!';
    end

  end

private
  def human_answer_params
    params.require(:human_answer).permit(:answer, :triplet_id)
  end

end
