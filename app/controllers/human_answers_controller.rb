class HumanAnswersController < ApplicationController
  def index
    @wrong_answers = HumanAnswer.joins(:triplet).where("answer = 'left' and compared_result <> 1").all
    @wrong_answers = @wrong_answers + HumanAnswer.joins(:triplet).where("answer = 'right' and compared_result <> -1").all


  end
  def create
    @human_answer = HumanAnswer.new(human_answer_params)
    @human_answer.user = @current_user
    if @human_answer.save
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
