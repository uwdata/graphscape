class HumanAnswer < ActiveRecord::Base
  belongs_to :triplet
  belongs_to :user

  def wrong?
    if answer=="left" && triplet.compared_result== 1
      true
    elsif answer=="right" && triplet.compared_result== -1
      true
    else
      false
    end
  end

  def self.all_with_csv_triplets
    human_answers = all
    if Triplet.all.count == 0
      human_answers = all.map do |human_answer|
        human_answer.triplet = Triplet.find_by_id_in_csv(human_answer.triplet_id);
        human_answer
      end
    end

    human_answers


  end
end
