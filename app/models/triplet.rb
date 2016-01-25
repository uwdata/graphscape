class Triplet < ActiveRecord::Base


  belongs_to :ref, foreign_key: :ref_id, class_name: "Spec"
  belongs_to :left, foreign_key: :left_id, class_name: "Spec"
  belongs_to :right, foreign_key: :right_id, class_name: "Spec"


end
