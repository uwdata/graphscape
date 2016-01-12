class Spec < ActiveRecord::Base
  has_many :ref_triplets, foreign_key: :ref_id, class_name: "Triplet"
  has_many :left_triplets, foreign_key: :ref_id, class_name: "Triplet"
  has_many :right_triplets, foreign_key: :ref_id, class_name: "Triplet"

  has_many :human_filters
  scope :less_filtered_one, -> {
    select("specs.*").joins("LEFT OUTER JOIN human_filters on specs.id = human_filters.spec_id").group("specs.id").order("count(human_filters.id)").first
  }
end
