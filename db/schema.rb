# encoding: UTF-8
# This file is auto-generated from the current state of the database. Instead
# of editing this file, please use the migrations feature of Active Record to
# incrementally modify your database, and then regenerate this schema definition.
#
# Note that this schema.rb definition is the authoritative source for your
# database schema. If you need to create the application database on another
# system, you should be using db:schema:load, not running all the migrations
# from scratch. The latter is a flawed and unsustainable approach (the more migrations
# you'll amass, the slower it'll run and the greater likelihood for issues).
#
# It's strongly recommended that you check this file into your version control system.

ActiveRecord::Schema.define(version: 20160120013859) do

  create_table "edges", force: :cascade do |t|
    t.integer "source_id"
    t.integer "target_id"
  end

  create_table "human_answers", force: :cascade do |t|
    t.string   "answer"
    t.integer  "triplet_id"
    t.datetime "created_at",             null: false
    t.datetime "updated_at",             null: false
    t.integer  "user_id",    default: 0
  end

  create_table "human_filters", force: :cascade do |t|
    t.string   "answer"
    t.integer  "spec_id"
    t.datetime "created_at",             null: false
    t.datetime "updated_at",             null: false
    t.integer  "user_id",    default: 0
  end

  create_table "rules", force: :cascade do |t|
    t.string   "user_id"
    t.string   "name"
    t.text     "script"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
  end

# Could not dump table "spec_coordinates" because of following NoMethodError
#   undefined method `[]' for nil:NilClass

  create_table "specs", force: :cascade do |t|
    t.text "json"
  end

  create_table "triplets", force: :cascade do |t|
    t.integer "ref_id"
    t.integer "left_id"
    t.integer "right_id"
    t.text    "compared_result"
    t.text    "reason"
  end

  create_table "users", force: :cascade do |t|
    t.string   "name"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
  end

end
