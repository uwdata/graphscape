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
end
