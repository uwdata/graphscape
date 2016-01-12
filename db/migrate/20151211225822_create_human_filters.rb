class CreateHumanFilters < ActiveRecord::Migration
  def change
    create_table :human_filters do |t|
      t.string :answer
      t.integer :spec_id

      t.timestamps null: false
    end
  end
end
