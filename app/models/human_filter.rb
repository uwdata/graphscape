class HumanFilter < ActiveRecord::Base
  belongs_to :spec
  belongs_to :user
end
