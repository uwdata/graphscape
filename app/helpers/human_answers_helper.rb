module HumanAnswersHelper
  def choice_class(user_answer, target)
    if user_answer.answer == target
      "user-choice"
    elsif ( ( user_answer.triplet.compared_result.to_i() == 1 && target=="left" ) || ( user_answer.triplet.compared_result.to_i() == -1 && target=="right" ) || ( user_answer.triplet.compared_result.to_i() == 0 && target=="ref" ))
      "machine-choice"
    end
  end
end
