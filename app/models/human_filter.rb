class HumanFilter < ActiveRecord::Base
  belongs_to :spec
  belongs_to :user

  def self.all_with_csv_triplets
    all.map do |human_answer|
      human_answer.triplet = Triplet.find_by_id_in_csv(human_answer.triplet_id);
      human_answer
    end
  end
end
