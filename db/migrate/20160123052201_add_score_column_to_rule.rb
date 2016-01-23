class AddScoreColumnToRule < ActiveRecord::Migration
  def change
    add_column :rules, :score, :float, default: 0
  end
end
