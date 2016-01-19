class AddColumnToHumanThings < ActiveRecord::Migration
  def change
    add_column :human_filters, :user_id, :integer, default: 0
    add_column :human_answers, :user_id, :integer, default: 0
  end
end
