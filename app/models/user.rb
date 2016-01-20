class User < ActiveRecord::Base
  has_many :rules
  has_many :human_answers
  has_many :human_filters
end
