class CreateRules < ActiveRecord::Migration
  def change
    create_table :rules do |t|

      t.string :user_id
      t.string :name
      t.text :script

      t.timestamps null: false
    end
  end
end
